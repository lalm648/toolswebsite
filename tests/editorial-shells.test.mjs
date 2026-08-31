import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the category grid renders tiles instead of hand-rolled paragraph cards", () => {
  const grid = source("src/components/CategoryGrid.tsx");

  assert.match(grid, /from "@\/components\/visual\/CategoryTile"/);
  assert.match(grid, /<CategoryTile/);
  // The description paragraph is exactly what the tile replaces.
  assert.doesNotMatch(grid, /category\.description/);
  // The old card also hard-coded a minimum height to force alignment.
  assert.doesNotMatch(grid, /min-h-40|min-h-32/);
});

test("the grid is dense enough to show the whole catalogue", () => {
  const grid = source("src/components/CategoryGrid.tsx");

  // Three columns fitted three categories on screen. Tiles must go further.
  assert.match(grid, /grid-cols-2/);
  assert.match(grid, /lg:grid-cols-(4|5)/);
});

test("SectionHeader renders a real heading with a referenceable id", () => {
  const header = source("src/components/visual/SectionHeader.tsx");

  assert.match(header, /<h2/);
  assert.match(header, /id=\{id\}/);
  assert.match(header, /eyebrow/);
  assert.match(header, /aside/);
  // The eyebrow is decorative labelling, never the accessible heading.
  assert.doesNotMatch(header, /<h1/);
});

test("the eyebrow uses a brand colour that is legible as text on light", () => {
  const header = source("src/components/visual/SectionHeader.tsx");

  // --accent-700 is #067A52 (5.37:1). The raw neon would be ~1.2:1.
  assert.match(header, /var\(--accent-700\)/);
  assert.doesNotMatch(header, /var\(--brand-mint\)|var\(--brand-lime\)/);
});

test("the hero compressor really compresses rather than showing fixed numbers", () => {
  const hero = source("src/components/visual/HeroCompressor.tsx");

  assert.match(hero, /from "@\/lib\/tools\/hero-compress"/);
  assert.match(hero, /from "@\/lib\/image-conversion"/);
  assert.match(hero, /from "@\/components\/tool\/FileDropzone"/);
  assert.match(hero, /compressionSummary/);
  // Any hard-coded byte figure would be a fabricated result.
  assert.doesNotMatch(hero, /4\.2 MB|386 KB/);
});

test("the hero compressor releases every object URL it creates", () => {
  const hero = source("src/components/visual/HeroCompressor.tsx");

  const created = (hero.match(/createObjectURL/g) ?? []).length;
  const revoked = (hero.match(/revokeObjectURL/g) ?? []).length;
  assert.ok(created > 0, "the component should create at least one object URL");
  assert.ok(
    revoked >= created,
    `created ${created} object URLs but revoke appears ${revoked} times — leaked blobs`,
  );
});

test("the hero compressor reports failure instead of failing silently", () => {
  const hero = source("src/components/visual/HeroCompressor.tsx");

  assert.match(hero, /catch/);
  assert.match(hero, /role="alert"|aria-live/);
});

test("the home hero is editorial and leads with the working tool", () => {
  const home = source("src/components/HomeCatalog.tsx");

  assert.match(home, /from "@\/components\/visual\/BrandBloom"/);
  assert.match(home, /from "@\/components\/visual\/HeroCompressor"/);
  assert.match(home, /<HeroCompressor/);
});

test("the hero headline stays real text so it remains the LCP element", () => {
  const home = source("src/components/HomeCatalog.tsx");

  assert.match(home, /<h1/);
  // A headline rendered as an image would wreck LCP and be unreadable to search.
  assert.doesNotMatch(home, /<h1[^>]*>\s*<(img|Image)/);
});

test("search survives the hero rebuild rather than being dropped", () => {
  const home = source("src/components/HomeCatalog.tsx");

  assert.match(home, /SearchBar/);
});
