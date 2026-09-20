import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/*
  Points the category tabs at the native Brahui word where the dictionary holds
  one, instead of the Perso-Arabic loan.

  The tabs are read as "the Brahui for the colours", so nine Persian loans under
  that heading teach the wrong language — and the native series píhun, maon,
  xísun, púşkun, xarrun, bor has been in the dictionary all along, unused.
  scripts/audit-brahui-loans.mjs finds these; this applies them.

  Choosing between two attested words is the hard part, and picking the first
  match would be wrong often enough to matter: "bride" would take bandaģ ("man;
  person; bride") over barámí ("bride"), and "head, top" would take the topic
  marker to ("TOP; then") over káŧum ("head").

  So a candidate is scored by how specific it is — how many senses its gloss
  carries — and the narrowest wins. A word glossed with one meaning is a
  translation; a word glossed with five is a word that can sometimes be used
  that way. Anything whose best candidate is still broader than MAX_SENSES is
  left alone and reported, because at that width the swap is a judgement about
  usage rather than a lookup.

  Audio is safe. These natives are dictionary headwords and every one already
  has a recording, so unlike a re-spelling this orphans nothing — but the script
  checks each one and refuses any swap that would silence a word.

  Run: node scripts/swap-brahui-loans.mjs --dry     (decide, change nothing)
       node scripts/swap-brahui-loans.mjs
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "public", "brahui", "index.html");
const dry = process.argv.includes("--dry");

/* Wider than this and the word is not a translation of the sense, just usable
   for it. Tuned against the cases above: barámí has 1, bandaģ has 3. */
const MAX_SENSES = 3;

const CATS = ["animal", "body", "food", "nature", "thing", "people", "time", "color"];

let html = fs.readFileSync(HTML, "utf8");

/* audioKey, lifted from the page so the recording check uses the same hash the
   app does. */
const slice = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); return html.slice(i, j); };
const coll = /const AUDIOCOLLISIONKEYS=(\[[^\]]*\]);/.exec(html);
const box = {};
vm.createContext(box);
vm.runInContext([
  slice("const C = {", "/* ---------- 2. ENGINE ---------- */"),
  slice("function tokenize(word){", "/* opts.sukun"),
  `const AUDIOCOLLISIONSET=new Set(${coll[1]});`,
  slice("function audioKey(s){", "\nlet clip=null;"),
].join("\n"), box);
const audioKeys = new Set(JSON.parse(/const AUDIOKEYS=(\[[^\]]*\]);/.exec(html)[1]));
const hasClip = (w) => audioKeys.has(box.audioKey(w));

const rows = [...html.matchAll(/<article class="lexrow"[^>]*>/g)].map((m) => {
  const a = m[0];
  const g = (k) => (new RegExp(`${k}="([^"]*)"`).exec(a) || [, ""])[1];
  return { br: g("data-b"), en: g("data-e"), pos: g("data-p"), src: g("data-t") };
});

const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").trim();
const senses = (s) => s.split(/[;,]/).map(norm).filter(Boolean);

/* Part of speech disambiguates where the spelling cannot.

   Several natives carry two related senses in two rows — píhun is "a. white"
   and "n. silver", xísun is "a. red" and "n. gold", barámí is "a. married" and
   "n. bride" — and belí carries two unrelated ones, "itj. yes; look!" and
   "n. friend". Excluding every spelling with more than one row was tried and
   threw out the three good ones to catch the fourth.

   Matching the category's expected part of speech keeps all four right: a
   colour takes the adjective, everything else takes the noun, and belí resolves
   to the noun that actually means friend.

   Disqualifying anything loan-tagged elsewhere was also tried, and was worse
   still — only 35% of rows carry data-t, so the tag is too sparse to argue from
   in that direction, and it removed píhun and xísun outright. */
const POS_FOR = { color: /^a\./, time: /^(n|adv)\./ };
const posOk = (cat, pos) => (POS_FOR[cat] || /^n\./).test(pos || "");

const index = new Map();
for (const r of rows) {
  for (const s of senses(r.en)) {
    if (!index.has(s)) index.set(s, []);
    index.get(s).push(r);
  }
}

const seedRe = /\{br:'([^']*)',(\s*)en:'([^']*)',(\s*)src:'([^']*)',(\s*)cat:'([^']*)'\}/g;

const swapped = [], skipped = [], silent = [];
const rejected = [];
html = html.replace(seedRe, (whole, br, s1, en, s2, src, s3, cat) => {
  if (src !== "LOAN" || !CATS.includes(cat)) return whole;

  let best = null;
  for (const sense of senses(en)) {
    for (const cand of index.get(sense) || []) {
      if (cand.br === br || cand.src) continue;
      if (!posOk(cat, cand.pos)) continue;
      const width = senses(cand.en).length;
      /* Narrowest gloss wins; ties break alphabetically so the run is
         reproducible rather than dependent on dictionary order. */
      if (!best || width < best.width || (width === best.width && cand.br < best.br)) {
        best = { br: cand.br, en: cand.en, width };
      }
    }
  }

  if (!best) return whole;
  if (best.width > MAX_SENSES) { skipped.push({ br, en, cand: best }); return whole; }
  if (!hasClip(best.br)) { silent.push({ br, en, cand: best }); return whole; }

  swapped.push({ cat, from: br, to: best.br, en, candEn: best.en });
  /* src becomes CORP: the word is no longer a loan, and the LOAN badge beside
     it would now be a lie. */
  return `{br:'${best.br}',${s1}en:'${en}',${s2}src:'CORP',${s3}cat:'${cat}'}`;
});

for (const cat of CATS) {
  const inCat = swapped.filter((s) => s.cat === cat);
  if (!inCat.length) continue;
  console.log(`${cat.toUpperCase()}  ${inCat.length}`);
  for (const s of inCat) console.log(`   ${s.from.padEnd(12)} -> ${s.to.padEnd(12)} "${s.en}"`);
  console.log();
}

if (skipped.length) {
  console.log(`LEFT ALONE — best candidate too broad (>${MAX_SENSES} senses), needs a speaker:`);
  for (const s of skipped) console.log(`   ${s.br.padEnd(12)} "${s.en}"   best was ${s.cand.br} ("${s.cand.en}")`);
  console.log();
}
if (silent.length) {
  console.log(`LEFT ALONE — the native word has no recording:`);
  for (const s of silent) console.log(`   ${s.br} -> ${s.cand.br}`);
  console.log();
}

console.log(`swapped ${swapped.length}   left alone ${skipped.length + silent.length}${dry ? "   (dry run — nothing written)" : ""}`);
if (!dry && swapped.length) {
  fs.writeFileSync(HTML, html);
  console.log("index.html written");
}
