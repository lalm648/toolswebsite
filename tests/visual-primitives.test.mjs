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
  "src/components/visual/DeviceFrame.tsx",
  "src/components/visual/CategoryTile.tsx",
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

test("DeviceFrame chrome is decorative and its URL is not a link", () => {
  const frame = source("src/components/visual/DeviceFrame.tsx");

  assert.match(frame, /aria-hidden/);
  // Chrome that looked clickable but was not would be a usability trap.
  assert.doesNotMatch(frame, /<a\b|next\/link/);
  assert.match(frame, /children/);
});

test("category visuals are declared once and shared", () => {
  const visuals = source("src/lib/data/category-visuals.tsx");
  const grid = source("src/components/CategoryGrid.tsx");
  const tile = source("src/components/visual/CategoryTile.tsx");

  for (const name of ["categoryIcons", "categoryTileStyles", "categorySurfaceStyles"]) {
    assert.match(visuals, new RegExp(`export const ${name}`), `missing export ${name}`);
    // Both consumers must import them rather than redeclare them.
    assert.doesNotMatch(grid, new RegExp(`const ${name}\\s*:`), `${name} redeclared in CategoryGrid`);
  }

  assert.match(grid, /from "@\/lib\/data\/category-visuals"/);
  assert.match(tile, /from "@\/lib\/data\/category-visuals"/);
});

test("every category slug has an icon and both colour maps", () => {
  const visuals = source("src/lib/data/category-visuals.tsx");
  const slugs = [
    "image", "video", "audio", "document", "text",
    "developer", "security", "network", "seo", "dictionary",
  ];

  for (const slug of slugs) {
    const occurrences = visuals.split(`${slug}:`).length - 1;
    assert.ok(occurrences >= 3, `${slug} appears ${occurrences} times, expected 3 maps`);
  }
});

test("CategoryTile is compact: a count, no description paragraph", () => {
  const tile = source("src/components/visual/CategoryTile.tsx");

  assert.match(tile, /toolCount/);
  // The paragraph is exactly what the tile replaces.
  assert.doesNotMatch(tile, /category\.description/);
});
