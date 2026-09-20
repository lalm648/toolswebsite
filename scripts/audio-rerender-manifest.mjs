import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/*
  Builds the list of Brahui recordings that have to be re-made, and the exact
  Devanagari to render each of them from.

  Why this exists
  ---------------
  The prepared clips are Lekha, the macOS Hindi voice, reading Devanagari — not
  Urdu, and not a neural Urdu voice, both of which were tried and are wrong for
  Brahui. Lekha expands abbreviations the way any speaking engine does, and डा
  is how Hindi shortens डॉक्टर. So when a sentence-initial capital was mis-read
  as the ASCII alias for retroflex đ, the demonstrative dá became retroflex डा
  instead of dental दा, and the recording for "Dá har musiŧŧingák…" says
  "doctor".

  Fixing tokenize() corrected the script on screen and the live voice, but it
  cannot change an .m4a rendered months ago. Those clips have to be made again,
  and the corrected दा is not an abbreviation of anything.

  Render the `deva` field. Not the Latin, not the Urdu: Lekha reads Devanagari.
  The `ipa` field rides along only as a cross-check for a human reviewer — daː
  is dental, ɖaː is retroflex, and that is the distinction the old recordings
  lost.

  The maps are read out of public/brahui/index.html rather than copied, so there
  is one source of truth for the transliteration. audioKey must stay identical
  to the page's fnv1a or every rendered file lands under a name the app never
  looks up.

  Run: node scripts/audio-rerender-manifest.mjs
  Writes: audio-rerender.json  (feed it to scripts/render-lekha.sh on a Mac)
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
  /* Devanagari is what actually gets spoken: the clips are rendered by Lekha,
     the macOS Hindi voice, which reads Devanagari and not Urdu. */
  slice("const DEVA_C={", "function lineDeva"),
  "function lineDeva(t){ return t.split(/\\s+/).filter(Boolean).map(toDeva).join(' '); }",
  `const AUDIOCOLLISIONSET=new Set(${collisions[1]});`,
  slice("function audioKey(s){", "\nlet clip=null;"),
].join("\n");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox);
const { toAzIPA, audioKey, lineDeva } = sandbox;

if (typeof toAzIPA !== "function" || typeof audioKey !== "function" || typeof lineDeva !== "function") {
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
  "Dá har musiŧŧingák asi.elo-ton ílumí karer.",
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

/* Compounds that were written as one word and have now been split apart.

   Both were wrong as single tokens: asieloton is "asi elo ton" ("one other
   with") and is spelled that way in the UDHR entry a few lines above it, while
   padepad is "pad e pad" ("after and after"), whose own parts are separate
   headwords. Run together, the tokenizer could not see the seam — asieloton
   came out اسےلوتون, with the vowel of asi corrupted across it — and the voice
   read one long nonsense word.

   Splitting them changes the text, and the text is the audio key, so each one
   retires a recording and needs a new one. That is the only reason these were
   not corrected earlier: the fix silently silenced the word until a re-render
   was on the table. It is now. */
const RESPELT = ["Dá har musiŧŧingák asi.elo-ton ílumí karer.", "pad e pad"];

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
  /* Devanagari is the string Lekha is actually given. IPA is carried alongside
     as a cross-check: a reviewer can see at a glance that dá is daː and not
     ɖaː, which is the distinction the old recordings lost. */
  return { key, text, deva: lineDeva(text.trim()), ipa, reason, existsOnDisk: onDisk.has(key) };
}

const manifest = [
  ...MISRENDERED.map((t) => entry(t, "rendered from the wrong letters — replace")),
  ...SYLLABLES.map((t) => entry(t, "sounds tab demonstration — never rendered")),
  ...PHRASES_WITHOUT_CLIP.map((t) => entry(t, "phrase with no recording")),
  ...RESPELT.map((t) => entry(t, "compound split into words — new key, needs its own recording")),
];

/* De-duplicate: the split phrase is listed as both misrendered and respelt, and
   it is one recording either way. */
const seen = new Set();
const unique = manifest.filter((m) => (seen.has(m.key) ? false : seen.add(m.key)));
manifest.length = 0;
manifest.push(...unique);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  note:
    "Render each entry's `deva` string with Lekha, the macOS Hindi voice, the same way the existing " +
    "6,646 clips were made: say -v Lekha -o public/brahui/audio/<key>.m4a \"<deva>\". Do not render the " +
    "Latin or the Urdu — Lekha reads Devanagari. Then bump AUDIOREV in index.html so browsers do not " +
    "serve a cached copy of the old pronunciation under the same key.",
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
  console.log(`  ${m.key}  ${m.existsOnDisk ? "replace" : "create "}  ${m.deva}`);
  console.log(`            ${m.text.slice(0, 60)}`);
}
