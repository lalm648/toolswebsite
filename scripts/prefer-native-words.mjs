import fs from "node:fs";
import path from "node:path";

/*
  Puts the native Brahui word into a category tab, and moves the loan it
  duplicates out of that tab.

  Two layers feed a tab and they behave differently, which is the thing to get
  right here. The SEED list supplies words the ILCAA dictionary does not have,
  each with a hand-picked category. The dictionary supplies the rest, carrying
  its own data-c. And index.html filters the seed layer with

      const seed = SEED.filter(w => !have.has(canon(w.br)))

  so a seed entry pointed at a word the dictionary already holds is dropped
  altogether. Rewriting the seed list to name native words therefore DELETES
  them from the tab — it emptied Animals from 24 to 5 on the first attempt.

  The native words are already in the dictionary. So the change belongs there:
  give pişşí data-c="animal" and it joins the tab, with nothing filtered and
  nothing lost. The loan's seed entry is then re-categorised to "noun", which
  takes it out of the tab while leaving the word searchable — a loan is still a
  word Brahui speakers use, and deleting it would be its own kind of wrong.

  Run: node scripts/prefer-native-words.mjs --cat animal --dry
       node scripts/prefer-native-words.mjs --cat animal
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "public", "brahui", "index.html");

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const only = args.includes("--cat") ? args[args.indexOf("--cat") + 1] : null;

const POS_FOR = { color: /^a\./, time: /^(n|adv)\./ };
const posOk = (cat, pos) => (POS_FOR[cat] || /^n\./).test(pos || "");
const MAX_SENSES = 3;

let html = fs.readFileSync(HTML, "utf8");

const rowRe = /<article class="lexrow"[^>]*>/g;
const rows = [...html.matchAll(rowRe)].map((m) => {
  const a = m[0];
  const g = (k) => (new RegExp(`${k}="([^"]*)"`).exec(a) || [, ""])[1];
  return { tag: a, br: g("data-b"), en: g("data-e"), pos: g("data-p"), cat: g("data-c"), src: g("data-t") };
});

const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").trim();
const senses = (s) => s.split(/[;,]/).map(norm).filter(Boolean);

const index = new Map();
for (const r of rows) {
  for (const s of senses(r.en)) {
    if (!index.has(s)) index.set(s, []);
    index.get(s).push(r);
  }
}

const seedRe = /\{br:'([^']*)',(\s*)en:'([^']*)',(\s*)src:'([^']*)',(\s*)cat:'([^']*)'\}/g;
const seeds = [...html.matchAll(seedRe)].map((m) => ({ br: m[1], en: m[3], src: m[5], cat: m[7] }));

/* Words the tab already shows natively, so a native is not promoted twice and
   two loans cannot both point at one word. */
const claimed = new Map();
for (const s of seeds) {
  if (!claimed.has(s.cat)) claimed.set(s.cat, new Set());
  claimed.get(s.cat).add(s.br);
}
for (const r of rows) {
  if (!r.cat) continue;
  if (!claimed.has(r.cat)) claimed.set(r.cat, new Set());
  claimed.get(r.cat).add(r.br);
}

const plan = [];
for (const s of seeds) {
  if (s.src !== "LOAN") continue;
  if (only && s.cat !== only) continue;

  let best = null;
  for (const sense of senses(s.en)) {
    for (const cand of index.get(sense) || []) {
      if (cand.src || cand.cat === s.cat) continue;
      if (!posOk(s.cat, cand.pos)) continue;
      if (claimed.get(s.cat)?.has(cand.br)) continue;
      const width = senses(cand.en).length;
      if (!best || width < best.width || (width === best.width && cand.br < best.br)) best = { ...cand, width };
    }
  }
  if (!best || best.width > MAX_SENSES) continue;
  claimed.get(s.cat).add(best.br);
  plan.push({ loan: s, native: best });
}

for (const p of plan) {
  console.log(`  ${p.loan.cat.padEnd(7)} ${p.loan.br.padEnd(11)} -> ${p.native.br.padEnd(11)} "${p.loan.en}"   (${p.native.cat} -> ${p.loan.cat})`);
}
console.log(`\n${plan.length} native words promoted; ${plan.length} loans moved to "noun"${dry ? "   (dry run)" : ""}`);

if (dry || !plan.length) process.exit(0);

for (const p of plan) {
  /* The dictionary row joins the tab. */
  const updated = p.native.tag.replace(/data-c="[^"]*"/, `data-c="${p.loan.cat}"`);
  if (!html.includes(p.native.tag)) throw new Error(`row for ${p.native.br} moved under me`);
  html = html.replace(p.native.tag, updated);

  /* The loan leaves the tab but stays in the dictionary. */
  const seedPat = new RegExp(`\\{br:'${p.loan.br.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}',(\\s*)en:'([^']*)',(\\s*)src:'LOAN',(\\s*)cat:'${p.loan.cat}'\\}`);
  if (!seedPat.test(html)) throw new Error(`seed entry for ${p.loan.br} not found`);
  html = html.replace(seedPat, (m, a, en, b, c) => `{br:'${p.loan.br}',${a}en:'${en}',${b}src:'LOAN',${c}cat:'noun'}`);
}

fs.writeFileSync(HTML, html);
console.log("index.html written");
