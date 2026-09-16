/**
 * Screen candidate Brahui entries from a new source against the lexicon that ships.
 *
 *   node scripts/check-brahui-candidates.mjs candidates.tsv
 *   node scripts/check-brahui-candidates.mjs candidates.jsonl --write new-entries.tsv
 *
 * Why this exists and why it stops here.
 *
 * The lexicon's source of truth is brahui-lexicon-ilcaa.json, which lives in the
 * separate Brahui-to-EN-URDU-Dictionary repository (see .gitignore). This script
 * deliberately does NOT merge into it. Everything under public/brahui/ is
 * generated output, so a merge written here would be overwritten by the next
 * `node build-single.js` — and worse, it would have to guess at a schema this
 * repository has never seen. The parser next door carries a comment about an
 * order-assuming guess that "already produced a confidently wrong answer once";
 * guessing at a 3.8 MB lexicon's shape would be the same mistake, larger.
 *
 * So this reads only what is actually here: the 3,473 headwords in the shipped
 * public/brahui/index.html. It answers the one question that has to be answered
 * before any merge — which candidates are genuinely new, which collide, and which
 * are not Brahui at all — and it hands back a clean file for the merge step that
 * happens in the other repository.
 *
 * Input: TSV (preferred) or JSONL, UTF-8, one entry per row.
 *
 *   required   brahui     romanised headword, Brolikva (á í ú ŧ đ ŕ ń ļ ş ź ģ)
 *   required   english    the gloss
 *   required   source     where this entry came from — a short citable tag
 *   optional   pos        part of speech, e.g. "n.", "adv."
 *   optional   word_class noun | adv | gram | pron | qual
 *   optional   page       page in the source
 *   optional   loan_source language a loanword came from, when known
 *   optional   ex_brahui / ex_gloss / ex_english / ex_citation
 *
 * TSV over CSV because the glosses contain commas and semicolons
 * ("grandmother; old woman") but never tabs. Urdu script is not an input column:
 * the generator derives it from the romanisation, so a hand-supplied column could
 * only ever disagree with it.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseBrahuiEntries } from "../src/lib/data/brahui-lexicon.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = ["brahui", "english", "source"];
const OPTIONAL = [
  "pos",
  "word_class",
  "page",
  "loan_source",
  "ex_brahui",
  "ex_gloss",
  "ex_english",
  "ex_citation",
];

/*
  One key for "the same word". Brahui romanisation carries diacritics that the
  same word is spelled with inconsistently across sources — the whole reason the
  README calls existing word lists "inconsistent about how the language is
  spelled". Decomposing and dropping the combining marks makes "ábád" and "abad"
  collide, which is what we want: a candidate spelled without its accents is a
  duplicate to be reviewed, not a new word to be added.

  Leading clitic and affix marks (=ham, -válá) are part of the headword's
  identity and are kept.
*/
export function headwordKey(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/*
  The exact bug this guards against: seven Urdu kinship terms (dádí, dádá, náná,
  nání, phuphí, xálá, damád) shipped as Brahui until a speaker caught them, and
  commit e39d742 removed them. Arabic-script characters in a romanisation column
  mean the wrong column was filled in; a gloss identical to the headword usually
  means an untranslated row. Neither is decidable here, so both are reported
  rather than dropped.
*/
const ARABIC_SCRIPT = /[؀-ۿݐ-ݿ]/;

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const header = lines[0].split("\t").map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const cells = line.split("\t");
    const row = { __line: index + 2 };
    header.forEach((name, column) => {
      row[name] = (cells[column] ?? "").trim();
    });
    return row;
  });
}

function parseJsonl(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => ({ ...JSON.parse(line), __line: index + 1 }));
}

/*
  A headword is NOT a unique key. 197 spellings in the shipped lexicon carry more
  than one entry — 430 entries, 12% of the corpus. `de` is both "sun; daylight;
  day; while" (n., 163 uses) and "who" (pron., 18 uses); `are` is "husband" and
  "oh my!"; `asi` is "one" and "sinner".

  Keying a Map on the headword alone kept whichever entry happened to be read
  last and silently discarded the rest, so a candidate meaning "day" was checked
  against "who" and reported as a collision that a human then had to resolve
  against a sense the lexicon never claimed. A Brahui speaker caught exactly that
  on `de`. Every spelling now holds ALL of its entries, and a collision report
  shows every sense rather than an arbitrary one.
*/
export function screenCandidates(candidates, existingEntries) {
  const existing = new Map();
  for (const entry of existingEntries) {
    const key = headwordKey(entry.latin);
    if (!existing.has(key)) existing.set(key, []);
    existing.get(key).push(entry);
  }

  const report = { new: [], duplicate: [], collision: [], multiSense: [], invalid: [] };
  const seenInFile = new Map();

  for (const row of candidates) {
    const brahui = (row.brahui ?? "").trim();
    const english = (row.english ?? "").trim();
    const problems = [];

    for (const field of REQUIRED) {
      if (!(row[field] ?? "").trim()) problems.push(`missing ${field}`);
    }
    if (brahui && ARABIC_SCRIPT.test(brahui)) {
      problems.push("brahui column holds Arabic script — romanisation expected");
    }
    if (brahui && english && headwordKey(brahui) === headwordKey(english)) {
      problems.push("gloss repeats the headword — row looks untranslated");
    }

    if (problems.length) {
      report.invalid.push({ line: row.__line, brahui, english, problems });
      continue;
    }

    const key = headwordKey(brahui);

    /*
      A second row for the same headword inside the candidate file is usually a
      SENSE, not a mistake — "balla: grandmother" and "balla: old woman" are one
      entry with two meanings, which is how the shipped lexicon already stores
      them ("grandmother; old woman"). Dropping the second row would quietly lose
      half the book's meanings, so identical rows are duplicates and differing
      ones are kept together for the merge to fold into one entry.
    */
    const earlier = seenInFile.get(key);
    if (earlier) {
      if ((earlier.english ?? "").trim().toLowerCase() === english.toLowerCase()) {
        report.duplicate.push({
          line: row.__line,
          brahui,
          english,
          against: `line ${earlier.__line} of this file`,
        });
      } else {
        report.multiSense.push({
          line: row.__line,
          brahui,
          english,
          groupsWith: earlier.__line,
        });
      }
      continue;
    }
    seenInFile.set(key, row);

    const shipped = existing.get(key);
    if (!shipped) {
      report.new.push(row);
      continue;
    }

    /*
      Same spelling, possibly several entries. If ANY of them already carries this
      gloss the word is present. If none does, the source may be adding a sense,
      correcting one, or describing a different word that merely shares a
      spelling — a judgment no script should make silently, so it goes to a human
      with every shipped sense laid out beside the candidate.
    */
    const match = shipped.find(
      (entry) => entry.gloss.trim().toLowerCase() === english.toLowerCase(),
    );
    if (match) {
      report.duplicate.push({ line: row.__line, brahui, english, against: "the shipped lexicon" });
    } else {
      report.collision.push({
        line: row.__line,
        brahui,
        // One sense reads as the plain gloss; several are labelled so the reader
        // can see which part of speech each belongs to.
        shippedGloss:
          shipped.length === 1
            ? shipped[0].gloss
            : shipped.map((entry) => `[${entry.pos || "?"}] ${entry.gloss}`).join(" || "),
        candidateGloss: english,
      });
    }
  }

  return report;
}

function toTsv(rows) {
  const columns = [...REQUIRED, ...OPTIONAL];
  const header = columns.join("\t");
  const body = rows.map((row) => columns.map((name) => (row[name] ?? "").trim()).join("\t"));
  return [header, ...body].join("\n");
}

function main() {
  const [inputPath, ...flags] = process.argv.slice(2);

  if (!inputPath) {
    console.error(
      "Usage: node scripts/check-brahui-candidates.mjs <candidates.tsv|.jsonl> [--write <out.tsv>]\n" +
        `Required columns: ${REQUIRED.join(", ")}\n` +
        `Optional columns: ${OPTIONAL.join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const text = readFileSync(inputPath, "utf8");
  const candidates = inputPath.endsWith(".jsonl") ? parseJsonl(text) : parseTsv(text);

  const lexicon = readFileSync(join(projectRoot, "public/brahui/index.html"), "utf8");
  const existingEntries = parseBrahuiEntries(lexicon);

  const report = screenCandidates(candidates, existingEntries);

  console.log(
    JSON.stringify(
      {
        candidates: candidates.length,
        shippedHeadwords: existingEntries.length,
        new: report.new.length,
        duplicate: report.duplicate.length,
        collision: report.collision.length,
        multiSense: report.multiSense.length,
        invalid: report.invalid.length,
      },
      null,
      2,
    ),
  );

  for (const row of report.invalid) {
    console.error(`  invalid  line ${row.line}  ${row.brahui || "(no headword)"} — ${row.problems.join("; ")}`);
  }
  for (const row of report.collision) {
    console.error(
      `  collision line ${row.line}  ${row.brahui}\n` +
        `      shipped:   ${row.shippedGloss}\n` +
        `      candidate: ${row.candidateGloss}`,
    );
  }

  const writeIndex = flags.indexOf("--write");
  if (writeIndex !== -1 && flags[writeIndex + 1]) {
    writeFileSync(flags[writeIndex + 1], `${toTsv(report.new)}\n`, "utf8");
    console.log(`\nWrote ${report.new.length} new entries to ${flags[writeIndex + 1]}`);
  }

  // Collisions and invalid rows need a decision before anything is merged.
  if (report.invalid.length || report.collision.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
