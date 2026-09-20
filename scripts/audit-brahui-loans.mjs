import fs from "node:fs";
import path from "node:path";

/*
  Does the dictionary already hold a native Brahui word for the meanings the
  category tabs show a Persian/Urdu loan for?

  Roughly 55% of the Brahui lexicon is Perso-Arabic or Balochi borrowing, and
  the app says so — every such entry is tagged LOAN. That is honest for a
  dictionary. It is not honest for a category tab that a learner reads as "the
  Brahui for the animals", because a tab filled with gadha, gurg and uştur
  teaches Urdu vocabulary under a Brahui heading.

  This asks a narrower question than "is it a loan": is there ANOTHER entry,
  carrying no source-language tag, that means the same thing? Where there is,
  the tab is choosing the wrong one of two words the dictionary already holds,
  and the fix is selection rather than new lexicography.

  It only reports. Choosing between two attested words is a speaker's judgement
  and not one this script — or its author — is qualified to make.

  Run: node scripts/audit-brahui-loans.mjs
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "public", "brahui", "index.html"), "utf8");

/* Dictionary rows carry data-b/-e/-p/-c and, for loans, data-t (the source
   language). Seed entries carry src:'LOAN' | 'CORP' | … */
const rows = [...html.matchAll(/<article class="lexrow"[^>]*>/g)].map((m) => {
  const a = m[0];
  const g = (k) => (new RegExp(`${k}="([^"]*)"`).exec(a) || [, ""])[1];
  return { br: g("data-b"), en: g("data-e"), pos: g("data-p"), cat: g("data-c"), src: g("data-t") };
});

const seed = [...html.matchAll(/\{br:'([^']*)',\s*\n?\s*en:'([^']*)',\s*src:'([^']*)',\s*cat:'([^']*)'\}/g)]
  .map((m) => ({ br: m[1], en: m[2], src: m[3], cat: m[4] }));

console.log(`dictionary rows ${rows.length}   seed entries ${seed.length}\n`);

/* Index every dictionary sense by its English words, so a loan in a category
   can be checked against everything else that means the same thing. */
const senseIndex = new Map();
const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, "").trim();
for (const r of rows) {
  for (const sense of r.en.split(/[;,]/).map(norm).filter(Boolean)) {
    if (!senseIndex.has(sense)) senseIndex.set(sense, []);
    senseIndex.get(sense).push(r);
  }
}

const CATS = ["animal", "body", "food", "nature", "thing", "people", "time", "color"];
let loanTotal = 0, replaceable = 0;

for (const cat of CATS) {
  const inCat = seed.filter((s) => s.cat === cat);
  if (!inCat.length) continue;
  const loans = inCat.filter((s) => s.src === "LOAN");
  loanTotal += loans.length;

  const findings = [];
  for (const s of loans) {
    const alts = [];
    for (const sense of s.en.split(/[;,]/).map(norm).filter(Boolean)) {
      for (const cand of senseIndex.get(sense) || []) {
        if (cand.br === s.br) continue;
        /* data-t names a source language, so an entry without it is not marked
           as borrowed — the best evidence available here that it is native. */
        if (cand.src) continue;
        if (!alts.some((a) => a.br === cand.br)) alts.push(cand);
      }
    }
    if (alts.length) { replaceable++; findings.push({ loan: s, alts: alts.slice(0, 3) }); }
  }

  console.log(`${cat.toUpperCase()}  ${inCat.length} entries, ${loans.length} loans, ${findings.length} with an unmarked alternative`);
  for (const f of findings) {
    console.log(`   ${f.loan.br.padEnd(14)} "${f.loan.en}"  ->  ${f.alts.map((a) => `${a.br} (${a.en})`).join("  |  ")}`);
  }
  if (!findings.length && loans.length) console.log(`   (no alternatives in the dictionary — these loans are the only word for those meanings)`);
  console.log();
}

console.log(`TOTAL loans in these categories: ${loanTotal}`);
console.log(`with an unmarked alternative:    ${replaceable}`);
