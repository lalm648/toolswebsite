import test from "node:test";
import assert from "node:assert/strict";

import { contrastRatio, parseHex, relativeLuminance } from "../src/lib/design/contrast.ts";

const near = (actual, expected, tolerance = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );

test("parseHex accepts both shorthand and full notation", () => {
  assert.deepEqual(parseHex("#FFFFFF"), [255, 255, 255]);
  assert.deepEqual(parseHex("#000000"), [0, 0, 0]);
  assert.deepEqual(parseHex("#d3fa05"), [211, 250, 5]);
  assert.deepEqual(parseHex("#FFF"), [255, 255, 255]);
  assert.deepEqual(parseHex("#0a0"), [0, 170, 0]);
});

test("parseHex rejects malformed input rather than guessing", () => {
  assert.throws(() => parseHex("d3fa05"), TypeError);
  assert.throws(() => parseHex("#GGGGGG"), TypeError);
  assert.throws(() => parseHex("#12345"), TypeError);
  assert.throws(() => parseHex(""), TypeError);
});

test("relativeLuminance matches the WCAG reference endpoints", () => {
  near(relativeLuminance("#FFFFFF"), 1);
  near(relativeLuminance("#000000"), 0);
});

test("contrastRatio matches WCAG reference values and ignores argument order", () => {
  near(contrastRatio("#FFFFFF", "#000000"), 21);
  near(contrastRatio("#000000", "#FFFFFF"), 21);
  near(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
});

test("contrastRatio reproduces the brand pairings the spec depends on", () => {
  near(contrastRatio("#08120C", "#D3FA05"), 15.83);
  near(contrastRatio("#08120C", "#00E7A0"), 11.74);
  near(contrastRatio("#067A52", "#FFFFFF"), 5.37);
  near(contrastRatio("#3F6B00", "#FFFFFF"), 6.34);
  near(contrastRatio("#FFFFFF", "#D3FA05"), 1.2);
});
