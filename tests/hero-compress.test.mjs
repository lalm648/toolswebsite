import test from "node:test";
import assert from "node:assert/strict";

import { compressionSummary, heroTargetDimensions } from "../src/lib/tools/hero-compress.ts";

test("heroTargetDimensions scales the longest edge down and keeps the ratio", () => {
  assert.deepEqual(heroTargetDimensions(3200, 1600), { width: 1600, height: 800 });
  assert.deepEqual(heroTargetDimensions(1600, 3200), { width: 800, height: 1600 });
  assert.deepEqual(heroTargetDimensions(4000, 3000, 2000), { width: 2000, height: 1500 });
});

test("heroTargetDimensions never upscales a small image", () => {
  assert.deepEqual(heroTargetDimensions(400, 300), { width: 400, height: 300 });
  assert.deepEqual(heroTargetDimensions(1, 1), { width: 1, height: 1 });
});

test("heroTargetDimensions returns whole pixels of at least one", () => {
  const result = heroTargetDimensions(1601, 3, 1600);
  assert.ok(Number.isInteger(result.width));
  assert.ok(Number.isInteger(result.height));
  assert.ok(result.height >= 1, "a very wide image must not collapse to zero height");
});

test("compressionSummary reports the real saving", () => {
  const summary = compressionSummary(4_200_000, 386_000);
  assert.ok(Math.abs(summary.ratio - 0.0919) < 0.001);
  assert.equal(summary.savedBytes, 3_814_000);
  assert.equal(summary.savedPercent, 91);
});

test("compressionSummary does not claim a saving when the file grew", () => {
  const summary = compressionSummary(1000, 1500);
  assert.equal(summary.ratio, 1, "ratio is clamped so the meter cannot overflow");
  assert.equal(summary.savedBytes, 0);
  assert.equal(summary.savedPercent, 0);
});

test("compressionSummary handles a zero-byte original without dividing by zero", () => {
  const summary = compressionSummary(0, 0);
  assert.equal(summary.ratio, 0);
  assert.equal(summary.savedBytes, 0);
  assert.equal(summary.savedPercent, 0);
});
