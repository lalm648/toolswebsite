import test from "node:test";
import assert from "node:assert/strict";

import { headwordKey, screenCandidates } from "../scripts/check-brahui-candidates.mjs";

const SHIPPED = [
  { latin: "balla", gloss: "grandmother; old woman" },
  { latin: "ábád", gloss: "populated" },
  { latin: "=ham", gloss: "too" },
];

function rows(...entries) {
  return entries.map((entry, index) => ({ __line: index + 2, source: "new book", ...entry }));
}

test("a headword absent from the shipped lexicon is new", () => {
  const report = screenCandidates(rows({ brahui: "xarmehrí", english: "hate" }), SHIPPED);

  assert.equal(report.new.length, 1);
  assert.equal(report.new[0].brahui, "xarmehrí");
  assert.equal(report.collision.length, 0);
});

test("the same headword and gloss is a duplicate, not an addition", () => {
  const report = screenCandidates(rows({ brahui: "balla", english: "grandmother; old woman" }), SHIPPED);

  assert.equal(report.new.length, 0);
  assert.equal(report.duplicate.length, 1);
  assert.equal(report.duplicate[0].against, "the shipped lexicon");
});

test("a headword spelled without its diacritics still counts as the same word", () => {
  /*
    Sources disagree about Brahui diacritics — the tool's own intro calls existing
    word lists "inconsistent about how the language is spelled". "abad" must not
    be added alongside "ábád".
  */
  assert.equal(headwordKey("ábád"), headwordKey("abad"));

  const report = screenCandidates(rows({ brahui: "abad", english: "populated" }), SHIPPED);
  assert.equal(report.new.length, 0);
  assert.equal(report.duplicate.length, 1);
});

test("the same headword with a different gloss is a collision for a human", () => {
  const report = screenCandidates(rows({ brahui: "balla", english: "elderly female relative" }), SHIPPED);

  assert.equal(report.new.length, 0);
  assert.equal(report.duplicate.length, 0);
  assert.deepEqual(report.collision, [
    {
      line: 2,
      brahui: "balla",
      shippedGloss: "grandmother; old woman",
      candidateGloss: "elderly female relative",
    },
  ]);
});

test("Arabic script in the romanisation column is rejected", () => {
  /*
    Seven Urdu kinship terms shipped as Brahui until a speaker caught them
    (commit e39d742). Urdu script pasted into the headword column is the most
    mechanical form of that mistake, so it fails rather than being imported.
  */
  const report = screenCandidates(rows({ brahui: "دادی", english: "grandmother" }), SHIPPED);

  assert.equal(report.new.length, 0);
  assert.equal(report.invalid.length, 1);
  assert.match(report.invalid[0].problems[0], /Arabic script/);
});

test("a row missing a required field is rejected and names the field", () => {
  const report = screenCandidates(
    [
      { __line: 2, brahui: "xarmehrí", english: "hate" },
      { __line: 3, brahui: "", english: "hate", source: "new book" },
    ],
    SHIPPED,
  );

  assert.equal(report.invalid.length, 2);
  assert.deepEqual(report.invalid[0].problems, ["missing source"]);
  assert.deepEqual(report.invalid[1].problems, ["missing brahui"]);
});

test("a gloss that merely repeats the headword is rejected as untranslated", () => {
  const report = screenCandidates(rows({ brahui: "xarmehrí", english: "xarmehri" }), SHIPPED);

  assert.equal(report.invalid.length, 1);
  assert.match(report.invalid[0].problems[0], /untranslated/);
});

test("an identical row repeated inside the candidate file is a duplicate", () => {
  const report = screenCandidates(
    rows(
      { brahui: "xarmehrí", english: "hate" },
      { brahui: "xarmehri", english: "hate" },
    ),
    SHIPPED,
  );

  assert.equal(report.new.length, 1, "the first spelling wins");
  assert.equal(report.duplicate.length, 1);
  assert.match(report.duplicate[0].against, /line 2 of this file/);
});

test("a second meaning for the same headword is kept as a sense, not dropped", () => {
  /*
    The shipped lexicon already stores multiple meanings in one entry
    ("grandmother; old woman"). A book listing them as two rows must not lose the
    second — that would silently discard half the meanings being imported.
  */
  const report = screenCandidates(
    rows(
      { brahui: "xarmehrí", english: "hate" },
      { brahui: "xarmehrí", english: "hostility" },
    ),
    SHIPPED,
  );

  assert.equal(report.duplicate.length, 0, "a different meaning is not a duplicate");
  assert.equal(report.new.length, 1);
  assert.deepEqual(report.multiSense, [
    { line: 3, brahui: "xarmehrí", english: "hostility", groupsWith: 2 },
  ]);
});

test("clitic and affix marks stay part of the headword's identity", () => {
  // "=ham" (a clitic) and "ham" are different entries; the key must not merge them.
  assert.notEqual(headwordKey("=ham"), headwordKey("ham"));

  const report = screenCandidates(rows({ brahui: "ham", english: "every" }), SHIPPED);
  assert.equal(report.new.length, 1);
});

test("a spelling with several entries is checked against all of them", () => {
  /*
    197 spellings in the shipped lexicon carry more than one entry — 430 entries,
    12% of the corpus. `de` is "sun; daylight; day; while" (n., 163 uses) AND
    "who" (pron., 18 uses). Keying on the headword alone kept whichever was read
    last, so a candidate meaning "day" was checked against "who" and reported as
    a collision against a sense the lexicon never claimed. A speaker caught it.
  */
  const shipped = [
    { latin: "de", pos: "n.", gloss: "sun; daylight; day; while" },
    { latin: "de", pos: "pron.", gloss: "who" },
  ];

  const known = screenCandidates(rows({ brahui: "de", english: "who" }), shipped);
  assert.equal(known.duplicate.length, 1, "the second entry must still be reachable");
  assert.equal(known.collision.length, 0);

  const first = screenCandidates(
    rows({ brahui: "de", english: "sun; daylight; day; while" }),
    shipped,
  );
  assert.equal(first.duplicate.length, 1, "and so must the first");
});

test("a collision on a multi-sense headword reports every sense, labelled", () => {
  const shipped = [
    { latin: "are", pos: "n.", gloss: "husband" },
    { latin: "are", pos: "itj.", gloss: "oh my!" },
  ];

  const report = screenCandidates(rows({ brahui: "are", english: "spouse" }), shipped);

  assert.equal(report.collision.length, 1);
  // Showing one arbitrary sense sends the reader to resolve the wrong meaning.
  assert.equal(report.collision[0].shippedGloss, "[n.] husband || [itj.] oh my!");
});

test("the meaning is matched before the spelling", () => {
  /*
    The case that forced this. Converting this wordlist's `dûî` "tongue" into
    Brolikva gave `dúí` — a real entry meaning "control", from `dú` "hand", as in
    holding something in your hand. Tongue is `duví`, with a `v` the source does
    not write.

    So the converted spelling landed on a DIFFERENT REAL WORD and nothing looked
    wrong. Matching on spelling would have called this both a new word and a
    conflicting definition of "control". The gloss is what survives the crossing
    between two romanisations; the spelling is not.
  */
  const shipped = [
    { latin: "dú", pos: "n.", gloss: "hand; arm" },
    { latin: "dúí", pos: "n.", gloss: "control" },
    { latin: "duví", pos: "n.", gloss: "tongue" },
  ];

  const report = screenCandidates(rows({ brahui: "dúí", english: "tongue" }), shipped);

  assert.equal(report.new.length, 0, "the word is present — under another spelling");
  assert.equal(report.collision.length, 0, "and this is not a disputed definition");
  assert.equal(report.variant.length, 1);
  assert.deepEqual(report.variant[0].lexiconSpelling, ["duví"]);
  // The homograph must be named too: silence about it is how this slipped past.
  assert.deepEqual(report.variant[0].alsoASpelling, ["dúí [n.] control"]);
});

test("a sense inside a packed gloss is still found", () => {
  // The lexicon packs senses into one field; a source offering just one of them
  // must not be treated as new.
  const shipped = [{ latin: "de", pos: "n.", gloss: "sun; daylight; day; while" }];

  const report = screenCandidates(rows({ brahui: "de", english: "day" }), shipped);

  assert.equal(report.new.length, 0);
  assert.equal(report.duplicate.length, 1);
});

test("a form match with a meaning found nowhere stays a question, not a verdict", () => {
  const shipped = [{ latin: "azal", pos: "n.", gloss: "beginning" }];

  const report = screenCandidates(rows({ brahui: "azal", english: "luck" }), shipped);

  assert.equal(report.collision.length, 1);
  assert.equal(report.collision[0].shippedGloss, "beginning");
  assert.equal(report.collision[0].candidateGloss, "luck");
});
