import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const PRIMITIVES = [
  "src/components/visual/BrandBloom.tsx",
  "src/components/visual/ResultMeter.tsx",
];

test("no visual primitive uses a blur filter", () => {
  for (const file of PRIMITIVES) {
    const content = source(file);
    assert.doesNotMatch(content, /filter:\s*blur|backdrop-blur|\bblur-\w/, `${file} uses a blur`);
  }
});

test("no visual primitive introduces a web font or external asset", () => {
  for (const file of PRIMITIVES) {
    const content = source(file);
    assert.doesNotMatch(content, /fonts\.googleapis|@font-face|https?:\/\//, `${file} loads externally`);
  }
});

test("BrandBloom is decorative, token-driven, and reserves its own space", () => {
  const bloom = source("src/components/visual/BrandBloom.tsx");

  assert.match(bloom, /aria-hidden/);
  assert.match(bloom, /var\(--brand-bloom\)/);
  assert.match(bloom, /pointer-events-none/);
  assert.match(bloom, /absolute/);
  // A bloom with no intrinsic size would collapse and shift its parent on paint.
  assert.match(bloom, /width/);
  assert.match(bloom, /height/);
});

test("ResultMeter exposes a labelled progressbar and clamps its fill", () => {
  const meter = source("src/components/visual/ResultMeter.tsx");

  assert.match(meter, /role="progressbar"/);
  assert.match(meter, /aria-valuenow/);
  assert.match(meter, /aria-valuemin/);
  assert.match(meter, /aria-valuemax/);
  assert.match(meter, /aria-label/);
  assert.match(meter, /var\(--brand-gradient\)/);
  // An unclamped ratio would overflow the track when value exceeds max.
  assert.match(meter, /Math\.min/);
  assert.match(meter, /Math\.max/);
});
