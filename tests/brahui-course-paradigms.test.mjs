import test from "node:test";
import assert from "node:assert/strict";

import { alignExample, harvestParadigms, personOf } from "../scripts/course/paradigms.mjs";

test("an example whose surface and gloss have the same token count aligns pairwise", () => {
  const pairs = alignExample("kar-oŧ ne", "do-FUT.1SG you");
  assert.deepEqual(pairs, [
    { surface: "kar-oŧ", gloss: "do-FUT.1SG" },
    { surface: "ne", gloss: "you" },
  ]);
});

test("an example whose token counts disagree is refused rather than mis-aligned", () => {
  /*
    The corpus is transcribed by hand and some lines carry a token more or less
    on one side. Aligning those anyway would attach a verb's gloss to its
    neighbour and teach a wrong form, so they are dropped.
  */
  assert.equal(alignExample("kar-oŧ ne dá", "do-FUT.1SG you"), null);
});

test("a verb's inflected forms are collected under its gloss stem", () => {
  const paradigms = harvestParadigms([
    ["kar-oŧ", "do-FUT.1SG"],
    ["kar-os", "do-FUT.2SG"],
    ["kar-ak", "do-IMP"],
  ]);

  const forms = paradigms.get("do");
  assert.equal(forms.get("FUT.1SG"), "kar-oŧ");
  assert.equal(forms.get("FUT.2SG"), "kar-os");
  assert.equal(forms.get("IMP"), "kar-ak");
});

test("the first attestation of a form wins, so one odd later line cannot displace it", () => {
  const paradigms = harvestParadigms([
    ["kar-oŧ", "do-FUT.1SG"],
    ["karr-oŧ", "do-FUT.1SG"],
  ]);

  assert.equal(paradigms.get("do").get("FUT.1SG"), "kar-oŧ");
});

test("trailing sentence punctuation is not part of the form", () => {
  const paradigms = harvestParadigms([["kar-oŧ.", "do-FUT.1SG"]]);
  assert.equal(paradigms.get("do").get("FUT.1SG"), "kar-oŧ");
});

test("only inflected tags are harvested, so case-marked nouns are ignored", () => {
  /*
    GEN, D/A and ALL mark nouns. A unit on the person system must not pick up
    "life-GEN" as though it were a verb paradigm.
  */
  const paradigms = harvestParadigms([["zind-aná", "life-GEN"]]);
  assert.equal(paradigms.size, 0);
});

test("person and number are read off a compound tag", () => {
  assert.equal(personOf("COP.PRS.3SG"), "3SG");
  assert.equal(personOf("NEG.FUT.1SG"), "1SG");
  assert.equal(personOf("IMP"), null);
});
