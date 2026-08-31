import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { groupByLetter, parseBrahuiEntries } from "../src/lib/data/brahui-lexicon.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Attribute order deliberately varies between rows, and one row carries data-t.
// A parser that assumes a fixed order silently drops entries — that exact bug
// already caused a wrong answer once, so it is pinned here.
const FIXTURE = `
<article class="lexrow" id="w-balla" data-b="balla" data-e="grandmother; old woman" data-p="n." data-c="noun" data-f="12" data-x="2"><span class="lex-ur ur" dir="rtl">بَلّہ</span><b lang="brh">balla</b><i>n.</i><span class="lex-en">grandmother; old woman</span></article>
<article class="lexrow" data-f="10" data-p="a." id="w-abad" data-t="Farsi" data-e="populated" data-b="ábád" data-c="qual"><span class="lex-ur ur" dir="rtl">آبَاد</span><b lang="brh">ábád</b></article>
<article class="lexrow" id="w-pira" data-b="píra" data-e="grandfather" data-p="n." data-c="noun" data-f="7"><span class="lex-ur ur" dir="rtl">پِیرہ</span></article>
<article class="lexrow" id="w-kon" data-b="-kon" data-e="like" data-p="a." data-c="gram" data-f="3"><span class="lex-ur ur" dir="rtl">کون</span></article>
<article class="lexrow" id="w-broken" data-p="n." data-c="noun"><span class="lex-ur ur" dir="rtl">؟</span></article>
`;

test("parseBrahuiEntries reads attributes regardless of their order", () => {
  const entries = parseBrahuiEntries(FIXTURE);
  const abad = entries.find((e) => e.id === "w-abad");

  assert.ok(abad, "an entry with attributes in a different order must still parse");
  assert.equal(abad.latin, "ábád");
  assert.equal(abad.gloss, "populated");
  assert.equal(abad.pos, "a.");
  assert.equal(abad.script, "آبَاد");
});

test("parseBrahuiEntries extracts every field including the script form", () => {
  const balla = parseBrahuiEntries(FIXTURE).find((e) => e.id === "w-balla");

  assert.deepEqual(balla, {
    id: "w-balla",
    latin: "balla",
    script: "بَلّہ",
    pos: "n.",
    gloss: "grandmother; old woman",
    frequency: 12,
  });
});

test("parseBrahuiEntries skips rows with no headword or no gloss", () => {
  const entries = parseBrahuiEntries(FIXTURE);

  assert.equal(entries.length, 4, "the row missing data-b and data-e must be dropped");
  assert.ok(!entries.some((e) => e.id === "w-broken"));
});

test("parseBrahuiEntries defaults a missing frequency to zero rather than NaN", () => {
  const entries = parseBrahuiEntries(
    `<article class="lexrow" id="w-x" data-b="x" data-e="y" data-p="n." data-c="noun"></article>`,
  );

  assert.equal(entries[0].frequency, 0);
});

test("groupByLetter buckets non-alphabetic headwords under #, sorted first", () => {
  const groups = groupByLetter(parseBrahuiEntries(FIXTURE));

  assert.equal(groups[0].letter, "#");
  assert.deepEqual(
    groups[0].entries.map((e) => e.latin),
    ["-kon"],
    "a headword starting with a hyphen is not a letter",
  );
  assert.deepEqual(
    groups.map((g) => g.letter),
    ["#", "A", "B", "P"],
  );
});

test("groupByLetter preserves source order inside a group", () => {
  const entries = parseBrahuiEntries(
    `<article class="lexrow" id="w-b2" data-b="bz" data-e="second" data-p="n." data-c="noun"></article>
     <article class="lexrow" id="w-b1" data-b="ba" data-e="first" data-p="n." data-c="noun"></article>`,
  );
  const group = groupByLetter(entries).find((g) => g.letter === "B");

  assert.deepEqual(group.entries.map((e) => e.gloss), ["second", "first"]);
});

test("the real lexicon file parses to the full corpus", () => {
  const html = readFileSync(path.join(projectRoot, "public/brahui/index.html"), "utf8");
  const entries = parseBrahuiEntries(html);

  assert.equal(entries.length, 3473);
  assert.ok(entries.every((e) => e.latin.length > 0 && e.gloss.length > 0));

  // Spot-check words a Brahui speaker confirmed, so a future regeneration that
  // loses them fails here instead of silently shipping.
  const byLatin = new Map(entries.map((e) => [e.latin, e]));
  assert.equal(byLatin.get("balla").gloss, "grandmother; old woman");
  assert.equal(byLatin.get("píra").gloss, "grandfather");
  assert.equal(byLatin.get("sálum").gloss, "son-in-law");
});

test("the removed Urdu kinship loanwords have not come back", () => {
  const html = readFileSync(path.join(projectRoot, "public/brahui/index.html"), "utf8");

  for (const loan of ["dádí", "dádá", "náná", "nání", "phuphí", "xálá", "damád"]) {
    assert.ok(
      !html.includes(`{br:'${loan}'`),
      `${loan} is Urdu, not Brahui, and was removed on a speaker's correction`,
    );
  }
});

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the word index spends one element per entry, not five", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  /*
    Measured on this page, three shapes:
      per-entry <dl>/<dt>/<dd>   18,530 elements   LCP 7,660 ms
      per-entry bold headword     ~3,600 elements   LCP ~1,000 ms
      plain text blocks              559 elements   LCP   792 ms

    Five elements per entry cost roughly ten times the LCP to restyle a secondary
    section that the interactive app above already presents better. One <b> around
    the headword buys the scannability that matters; the rest of each line is a
    text node, which is free.
  */
  assert.match(component, /<b /, "the headword gets exactly one element");
  assert.match(component, /whitespace-pre-line/, "the rest of the line stays text");
  assert.doesNotMatch(component, /<(dd|dt)\b/, "per-field elements measured 10x the LCP");
  assert.match(component, /groups\.map/, "one section per letter group");
});

test("the word index keeps the page short without hiding content from crawlers", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  /*
    3,473 entries expanded would make the page an endless scroll. A closed
    <details> is still in the DOM, so the words remain indexable while the reader
    sees a compact letter index. Anything JavaScript-gated would not be.
  */
  assert.match(component, /<details/, "letter sections collapse");
  assert.match(component, /<summary/, "and have a real disclosure control");
  // `aria-hidden` on a decorative arrow is fine; the bare `hidden` attribute and
  // display:none are not, because they remove content rather than collapse it.
  assert.doesNotMatch(component, /(?<!aria-)\bhidden=/, "no bare hidden attribute");
  assert.doesNotMatch(component, /display:\s*none/, "content must stay in the DOM");
});

test("the word index is a server component and ships no JavaScript", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  assert.doesNotMatch(component, /"use client"/);
  assert.doesNotMatch(component, /useState|useEffect|onClick|onChange/);
});

test("the word index marks the Brahui script with language and direction", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  // Mixed Latin and Arabic on one line renders in the wrong visual order without
  // an isolate. Unicode isolates cost zero DOM elements, unlike a wrapper span.
  assert.match(component, /\\u2068|⁨/, "script forms need a first-strong isolate");
  assert.match(component, /\\u2069|⁩/, "and a matching pop-directional-isolate");
  assert.match(component, /lang="brh"/);
});

test("ToolShell exposes a slot after the workbench without breaking callers", () => {
  const shell = source("src/components/tool/ToolShell.tsx");

  assert.match(shell, /afterWorkbench\?: ReactNode/, "the slot must be optional");
  assert.match(shell, /\{afterWorkbench\}/);
});

test("the Brahui route renders the word list into its own HTML", () => {
  const page = source("src/app/tools/dictionary/brahui-dictionary/page.tsx");

  assert.match(page, /from "@\/components\/tool\/BrahuiWordIndex"/);
  assert.match(page, /parseBrahuiEntries/);
  assert.match(page, /groupByLetter/);
  assert.match(page, /readFileSync/, "the lexicon is read at build time");
  // A client component here would ship 900 KB of words as JavaScript.
  assert.doesNotMatch(page, /"use client"/);
});
