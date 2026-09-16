import test from "node:test";
import assert from "node:assert/strict";

import { buildLoanReport, readLoanSources } from "../scripts/brahui-loan-report.mjs";

// data-t sits in a different position on each row on purpose: the generator
// emits attributes in an unstable order, and an order-assuming reader has
// already produced a confidently wrong answer once in this codebase.
const FIXTURE = `
<article class="lexrow" id="w-du" data-b="dú" data-e="hand; arm" data-p="n." data-f="81"></article>
<article class="lexrow" id="w-dast" data-t="Farsi" data-b="dast" data-e="hand" data-p="n." data-f="3"></article>
<article class="lexrow" id="w-de" data-b="de" data-e="sun; daylight; day" data-p="n." data-f="163"></article>
<article class="lexrow" data-f="2" data-e="sun" id="w-aftab" data-b="áftáb" data-p="n." data-t="Farsi"></article>
<article class="lexrow" id="w-radio" data-b="redió" data-e="radio" data-p="n." data-f="1" data-t="English"></article>
`;

function report() {
  const entries = [
    { id: "w-du", latin: "dú", gloss: "hand; arm", frequency: 81 },
    { id: "w-dast", latin: "dast", gloss: "hand", frequency: 3 },
    { id: "w-de", latin: "de", gloss: "sun; daylight; day", frequency: 163 },
    { id: "w-aftab", latin: "áftáb", gloss: "sun", frequency: 2 },
    { id: "w-radio", latin: "redió", gloss: "radio", frequency: 1 },
  ];
  return buildLoanReport(entries, readLoanSources(FIXTURE));
}

test("the donor language is read whatever position the attribute sits in", () => {
  const sources = readLoanSources(FIXTURE);

  assert.equal(sources.get("w-dast"), "Farsi");
  assert.equal(sources.get("w-aftab"), "Farsi", "data-t last on the row must still be read");
  assert.equal(sources.get("w-du"), undefined, "an untagged entry is native");
});

test("a borrowed word is paired with the native word for the same meaning", () => {
  const { replaceable } = report();
  const hand = replaceable.find((row) => row.loan.latin === "dast");

  assert.ok(hand, "dast means hand, and so does dú");
  assert.deepEqual(hand.natives.map((n) => n.latin), ["dú"]);
});

test("a sense buried inside a packed gloss still pairs", () => {
  /*
    The card view showed áftáb (Farsi) for "sun" while the corpus carries `de` at
    163 uses — but `de`'s gloss is "sun; daylight; day", so only a sense-by-sense
    comparison finds it. Matching whole glosses would have missed the single most
    used word in this example.
  */
  const { replaceable } = report();
  const sun = replaceable.find((row) => row.loan.latin === "áftáb");

  assert.ok(sun);
  assert.deepEqual(sun.natives.map((n) => n.latin), ["de"]);
});

test("a borrowed word with no native equivalent is reported separately", () => {
  const { only } = report();

  assert.deepEqual(only.map((loan) => loan.latin), ["redió"]);
});

test("the counts split the lexicon without losing an entry", () => {
  const { native, loans, replaceable, only } = report();

  assert.equal(native.length, 2);
  assert.equal(loans.length, 3);
  assert.equal(replaceable.length + only.length, loans.length, "every loan lands in one bucket");
});
