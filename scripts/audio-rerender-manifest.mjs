import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/*
  Builds the list of Brahui recordings that have to be re-rendered, and the IPA
  to render them from.

  Why this exists
  ---------------
  The prepared clips were rendered from Urdu script, and an Urdu voice reads
  Urdu script the way an English one reads "Dr.": it expands abbreviations. The
  demonstrative dá is written ڈا once a sentence-initial capital has been
  mis-read as the ASCII alias for retroflex đ, and ڈا is how Urdu abbreviates
  ڈاکٹر — so the recording for "Dá har musiŧŧingák…" says "doctor". The spelling
  bug is fixed in tokenize(), but a fix in the page cannot change an .m4a that
  was rendered months ago. Those clips have to be made again.

  Render from IPA, not from script. The app's AZIPA map covers all 49 phonemes
  and distinguishes exactly what matters — dá is daː and đá is ɖaː — and a voice
  handed <phoneme alphabet="ipa" ph="daː"> has no text to expand. That closes
  this class of bug rather than patching one word of it.

  The maps are read out of public/brahui/index.html rather than copied, so there
  is one source of truth for the transliteration. audioKey must stay identical
  to the page's fnv1a or every rendered file lands under the wrong name.

  Run: node scripts/audio-rerender-manifest.mjs
  Writes: audio-rerender.json
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "public", "brahui", "index.html");
const AUDIO = path.join(ROOT, "public", "brahui", "audio");

const html = fs.readFileSync(HTML, "utf8");

/* Pull a contiguous run of the page's own source into a sandbox. Lifting the
   real code beats re-implementing it: a second copy of the tokenizer would
   drift, and a drifted tokenizer renders audio under keys the page never looks
   up. */
function slice(startMarker, endMarker) {
  const a = html.indexOf(startMarker);
  const b = html.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`cannot find ${startMarker} … ${endMarker}`);
  return html.slice(a, b);
}

/* audioKey salts a second round for the handful of words that collide under
   fnv1a, so the collision list has to come across with it or every key is
   wrong for exactly those words. */
const collisions = /const AUDIOCOLLISIONKEYS=(\[[^\]]*\]);/.exec(html);
if (!collisions) throw new Error("cannot find AUDIOCOLLISIONKEYS in index.html");

const engineSrc = [
  slice("const C = {", "/* ---------- 2. ENGINE ---------- */"),
  slice("function tokenize(word){", "/* opts.sukun"),
  slice("const AZIPA={", "function toAzIPA"),
  "function toAzIPA(word){ return tokenize(word).map(t=>AZIPA[t]||'').join(''); }",
  `const AUDIOCOLLISIONSET=new Set(${collisions[1]});`,
  slice("function audioKey(s){", "\nlet clip=null;"),
].join("\n");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox);
const { toAzIPA, audioKey } = sandbox;

if (typeof toAzIPA !== "function" || typeof audioKey !== "function") {
  throw new Error("the engine did not load — index.html markers moved");
}

/* Which keys already exist on disk, so the manifest can say why each entry is
   listed: a wrong recording to replace, or one that was never made. */
const onDisk = new Set(
  fs.existsSync(AUDIO)
    ? fs.readdirSync(AUDIO).filter((f) => f.endsWith(".m4a")).map((f) => f.replace(/\.m4a$/, ""))
    : [],
);

/* Entries whose text contains a word the capital-alias bug changed. Their
   recordings were rendered from the wrong letters. */
const MISRENDERED = [
  "Dá har musiŧŧingák asieloton ílumí karer.",
  "Asi xazmas as, asi xáxoas as, asi şokas as.",
  "As asi şohánas.",
  "Andáde ofte asi elo ton ílumí e vaddifoí e.",
  "Asi deas xácá, tuģas xaná.",
];

/* Sounds-tab demonstration syllables. Not dictionary words, so they were never
   rendered, and two thirds of that tab opens Settings instead of speaking. */
const SYLLABLES = [
  "tá", "ŧá", "đá", "ká", "gá", "fá", "zá", "źá", "xá", "ģá", "má", "ńá",
  "lá", "ļá", "rá", "ŕá", "'á",
  "bhá", "phá", "thá", "ŧhá", "dhá", "đhá", "khá", "ghá", "chá", "jhá", "ŕhá",
  "bát", "tín", "do", "hai", "kaun",
];

const PHRASES_WITHOUT_CLIP = ["Salám", "Naa nám ant?", "Nií ant kanning?", "Ant o?", "Muáf ka."];

function entry(text, reason) {
  const key = audioKey(text.trim());
  /* Word by word: the page speaks a phrase as one utterance, but the IPA has to
     keep its word boundaries or the voice runs it together. */
  const ipa = text
    .trim()
    .split(/\s+/)
    .map((w) => toAzIPA(w.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, "")))
    .filter(Boolean)
    .join(" ");
  return { key, text, ipa, reason, existsOnDisk: onDisk.has(key) };
}

const manifest = [
  ...MISRENDERED.map((t) => entry(t, "rendered from the wrong letters — replace")),
  ...SYLLABLES.map((t) => entry(t, "sounds tab demonstration — never rendered")),
  ...PHRASES_WITHOUT_CLIP.map((t) => entry(t, "phrase with no recording")),
];

const out = {
  generated: new Date().toISOString().slice(0, 10),
  note:
    "Render each entry from its IPA with <phoneme alphabet='ipa' ph='...'>, not from Urdu script. " +
    "Write the result to public/brahui/audio/<key>.m4a and bump AUDIOREV in index.html so browsers " +
    "do not serve a cached copy of the old pronunciation under the same key.",
  count: manifest.length,
  replace: manifest.filter((m) => m.existsOnDisk).length,
  create: manifest.filter((m) => !m.existsOnDisk).length,
  entries: manifest,
};

fs.writeFileSync(path.join(ROOT, "audio-rerender.json"), JSON.stringify(out, null, 2));

console.log(`audio-rerender.json`);
console.log(`  entries  ${out.count}`);
console.log(`  replace  ${out.replace}  (a wrong recording exists under this key)`);
console.log(`  create   ${out.create}`);
console.log();
for (const m of manifest.slice(0, 6)) {
  console.log(`  ${m.key}  ${m.existsOnDisk ? "replace" : "create "}  ${m.ipa}`);
  console.log(`            ${m.text.slice(0, 60)}`);
}
