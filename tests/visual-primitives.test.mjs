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
