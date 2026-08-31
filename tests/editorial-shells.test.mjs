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
