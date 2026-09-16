/**
 * Which Brahui words in the lexicon are borrowed, and which have a native word
 * saying the same thing.
 *
 *   node scripts/brahui-loan-report.mjs                 summary by source language
 *   node scripts/brahui-loan-report.mjs --replaceable   loans a native word covers
 *   node scripts/brahui-loan-report.mjs --only          loans with no native form
 *   node scripts/brahui-loan-report.mjs --lang Farsi    narrow to one source
 *   node scripts/brahui-loan-report.mjs --tsv out.tsv   write the whole thing
 *
 * Why this exists. The dictionary's card view was showing `dast` for "hand" and
 * `múş` for "mouse" — Farsi, both of them — while the corpus carries `dú` (81
 * uses) and `hal`. The generator had no way to prefer the native word because
 * nothing had ever lined the two up. This does that lining up.
 *
 * A loan is an entry the source tagged with a donor language in `data-t`; a
 * native word is one with no such tag. Pairing is by MEANING, not spelling:
 * `data-e` holds several senses in one field ("sun; daylight; day; while"), so
 * each is indexed separately and a loan matches a native word when they share
 * any sense. Spelling cannot do this job — the two words are unrelated by
 * definition, which is the whole point.
 *
 * What it does NOT do: decide anything. A native word existing does not mean it
 * is the word speakers use, and "replaceable" here means "a native word carries
 * this meaning", not "swap it". That call belongs to a speaker.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseBrahuiEntries } from "../src/lib/data/brahui-lexicon.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/*
  `parseBrahuiEntries` does not read the donor-language attribute, because
  nothing that ships needs it. Read it here, by the same rule the parser next
  door follows: attributes independently, never assuming their order — the
  source emits them inconsistently and an order-assuming pattern has already
  produced a confidently wrong answer once.
*/
export function readLoanSources(html) {
  const sources = new Map();
  for (const row of html.match(/<article class="lexrow"[^>]*>/g) ?? []) {
    const id = row.match(/id="([^"]*)"/);
    const donor = row.match(/data-t="([^"]*)"/);
    if (id && donor && donor[1].trim()) sources.set(id[1], donor[1].trim());
  }
  return sources;
}

/*
  105 entries are glossed morphologically rather than translated — `-válá`
  "PROPR", `alk` "take-PST.3SG", `í-á` "ALL". They are inflected forms and
  grammatical markers, not words a speaker could use in place of a loan, so
  offering them as alternatives is noise: `í-á` "ALL" was being suggested as the
  native replacement for `kul` "all".

  A gloss counts as morphological when it carries a run of capitals in the
  Leipzig style (PST, 3SG, COP, IDF, PROPR). Ordinary glosses are lower case
  here, and proper nouns like "Dasht" are single capitals, so neither is caught.
*/
const MORPHOLOGICAL = /\b[A-Z]{2,}(\.[A-Z0-9]+)*\b/;

/*
  "Untagged" is not the same as "native", and this is where the difference bites.
  `sáf` (Arabic, "clean") was being offered `safá` as its native replacement;
  `ahvál` "news" was offered `havál`. Same word, same root, one of them simply
  never tagged. Swapping one for the other removes nothing borrowed.

  Semitic and Iranian roots survive in the consonants, so comparing consonant
  skeletons catches this where comparing spellings does not: sáf/safá → sf,
  ahvál/havál → hvl. 38 of 364 proposed removals are this.
*/
function consonantSkeleton(word) {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[aeiou'’\-= ]/g, "");
}

export function sameRoot(a, b) {
  const x = consonantSkeleton(a);
  const y = consonantSkeleton(b);
  /*
    Two consonants minimum, or the test swallows the cases it exists to protect.
    `dú` "hand" reduces to a bare "d", which prefix-matches `dast` — and calling
    the native word for hand a derivative of the Farsi one is precisely the
    error this function is meant to prevent. Same for `na`/`nae` and `saí`/`sahí`.
  */
  if (x.length < 2 || y.length < 2) return false;
  return x === y || x.startsWith(y) || y.startsWith(x);
}

function senses(gloss) {
  if (MORPHOLOGICAL.test(gloss)) return [];
  return gloss
    .split(/[;,]/)
    .map((sense) => sense.trim().toLowerCase())
    .filter(Boolean);
}

export function buildLoanReport(entries, loanSources) {
  const native = [];
  const loans = [];
  for (const entry of entries) {
    const donor = loanSources.get(entry.id);
    if (donor) loans.push({ ...entry, donor });
    else native.push(entry);
  }

  const nativeBySense = new Map();
  for (const entry of native) {
    for (const sense of senses(entry.gloss)) {
      if (!nativeBySense.has(sense)) nativeBySense.set(sense, []);
      nativeBySense.get(sense).push(entry);
    }
  }

  const replaceable = [];
  const only = [];
  for (const loan of loans) {
    const matches = new Map();
    for (const sense of senses(loan.gloss)) {
      for (const entry of nativeBySense.get(sense) ?? []) matches.set(entry.latin, entry);
    }
    // A word is not its own alternative — a loan and a native entry can share a
    // spelling when the tagging disagrees between senses.
    matches.delete(loan.latin);

    if (matches.size) replaceable.push({ loan, natives: [...matches.values()] });
    else only.push(loan);
  }

  const byLanguage = new Map();
  for (const loan of loans) {
    byLanguage.set(loan.donor, (byLanguage.get(loan.donor) ?? 0) + 1);
  }

  return { native, loans, replaceable, only, byLanguage };
}

function main() {
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const value = (name) => {
    const at = args.indexOf(name);
    return at === -1 ? null : args[at + 1];
  };

  const html = readFileSync(join(projectRoot, "public/brahui/index.html"), "utf8");
  const entries = parseBrahuiEntries(html);
  const report = buildLoanReport(entries, readLoanSources(html));

  const lang = value("--lang");
  const keep = (loan) => !lang || loan.donor.toLowerCase().includes(lang.toLowerCase());
  const byUse = (a, b) => (b.loan ?? b).frequency - (a.loan ?? a).frequency;

  console.log(
    `${entries.length} entries — ${report.native.length} native/untagged, ${report.loans.length} borrowed\n`,
  );
  for (const [donor, count] of [...report.byLanguage].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${donor}`);
  }
  console.log(
    `\n  ${report.replaceable.length} borrowed words have a native word for the same meaning` +
      `\n  ${report.only.length} have none — the loan is the only word here\n`,
  );

  if (flag("--replaceable")) {
    console.log("BORROWED WORDS A NATIVE WORD ALREADY COVERS\n");
    for (const row of report.replaceable.filter((r) => keep(r.loan)).sort(byUse)) {
      console.log(
        `  ${row.loan.latin} (${row.loan.donor}, ${row.loan.frequency}x) — ${row.loan.gloss}\n` +
          `      native: ${row.natives.map((n) => `${n.latin} (${n.frequency}x) ${n.gloss}`).join("  |  ")}`,
      );
    }
  }

  if (flag("--only")) {
    console.log("BORROWED WORDS WITH NO NATIVE EQUIVALENT HERE\n");
    for (const loan of report.only.filter(keep).sort(byUse)) {
      console.log(`  ${loan.latin} (${loan.donor}, ${loan.frequency}x) — ${loan.gloss}`);
    }
  }

  /*
    The removal list: borrowed words a native word could take over from.

    It is a proposal, not an instruction, and every row carries the reason to
    doubt it. 21 of these loans are used more often than the native word they
    would be replaced by — `xalk` (Arabic) appears 205 times against `álum` at
    16 — and a dictionary that drops the word speakers actually say in favour of
    a rarer one has been made worse, however native the result looks. Brahui has
    borrowed for centuries; the loans ARE the language as spoken.

    So the caution column exists to be read. Rows with an empty one are the safe
    end of the list.
  */
  const removals = value("--removals");
  if (removals) {
    const lines = ["remove\tenglish\tdonor\tremove_uses\tkeep\tkeep_uses\tcaution"];
    for (const row of report.replaceable.filter((r) => keep(r.loan)).sort(byUse)) {
      const best = [...row.natives].sort((a, b) => b.frequency - a.frequency)[0];
      const caution = [];
      if (row.loan.frequency > best.frequency) {
        caution.push(`loan used ${row.loan.frequency}x vs native ${best.frequency}x`);
      }
      if (best.frequency <= 2) caution.push("native barely attested");
      if (row.natives.length > 2) caution.push(`${row.natives.length} candidates — pick one`);
      // An English word with several senses on the native side is where a
      // homonym pairing hides: "well" matched both the water and the good sense.
      if (best.gloss.split(/[;,]/).length >= 4) caution.push("native gloss broad — check the sense");
      if (row.natives.some((n) => sameRoot(n.latin, row.loan.latin))) {
        caution.push("candidate is built on the loan's own root");
      }

      lines.push(
        [
          row.loan.latin,
          row.loan.gloss,
          row.loan.donor,
          row.loan.frequency,
          row.natives.map((n) => n.latin).join("; "),
          row.natives.map((n) => n.frequency).join("; "),
          caution.join("; "),
        ].join("\t"),
      );
    }
    writeFileSync(removals, `${lines.join("\n")}\n`, "utf8");
    const clean = lines.slice(1).filter((l) => l.endsWith("\t")).length;
    console.log(
      `\nWrote ${lines.length - 1} proposed removals to ${removals}` +
        `\n  ${clean} carry no caution; ${lines.length - 1 - clean} need a decision first`,
    );
  }

  const tsv = value("--tsv");
  if (tsv) {
    const lines = ["brahui\tenglish\tdonor\tfrequency\tnative_alternatives"];
    for (const row of report.replaceable) {
      lines.push(
        [
          row.loan.latin,
          row.loan.gloss,
          row.loan.donor,
          row.loan.frequency,
          row.natives.map((n) => n.latin).join("; "),
        ].join("\t"),
      );
    }
    for (const loan of report.only) {
      lines.push([loan.latin, loan.gloss, loan.donor, loan.frequency, ""].join("\t"));
    }
    writeFileSync(tsv, `${lines.join("\n")}\n`, "utf8");
    console.log(`\nWrote ${lines.length - 1} borrowed words to ${tsv}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
