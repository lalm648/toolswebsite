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
  "src/components/visual/BeforeAfter.tsx",
  "src/components/visual/HeroVisual.tsx",
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
    // The maps are declared once in category-visuals.tsx; no consumer redeclares them.
    assert.doesNotMatch(grid, new RegExp(`const ${name}\\s*:`), `${name} redeclared in CategoryGrid`);
    assert.doesNotMatch(tile, new RegExp(`const ${name}\\s*:`), `${name} redeclared in CategoryTile`);
  }

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

test("BeforeAfter labels both sides and reuses ResultMeter", () => {
  const beforeAfter = source("src/components/visual/BeforeAfter.tsx");

  assert.match(beforeAfter, /beforeLabel/);
  assert.match(beforeAfter, /afterLabel/);
  assert.match(beforeAfter, /beforeValue/);
  assert.match(beforeAfter, /afterValue/);
  assert.match(beforeAfter, /from "@\/components\/visual\/ResultMeter"/);
  // Numbers must be comparable at a glance, so they are tabular and monospaced.
  assert.match(beforeAfter, /font-mono/);
});

test("BeforeAfter does not compute the values it displays", () => {
  const beforeAfter = source("src/components/visual/BeforeAfter.tsx");

  // Formatting bytes here would duplicate logic each tool already owns.
  assert.doesNotMatch(beforeAfter, /1024|toFixed\(/);
});

test("HeroVisual routes supplied images through next/image with fixed dimensions", () => {
  const hero = source("src/components/visual/HeroVisual.tsx");

  assert.match(hero, /from "next\/image"/);
  // A raw <img> without dimensions is the classic CLS regression.
  assert.doesNotMatch(hero, /<img\b/);
  assert.match(hero, /width/);
  assert.match(hero, /height/);
});

test("HeroVisual falls back to self-generated art when no image is supplied", () => {
  const hero = source("src/components/visual/HeroVisual.tsx");

  assert.match(hero, /slot/);
  assert.match(hero, /<svg/);
  assert.match(hero, /aspect-/);
});
