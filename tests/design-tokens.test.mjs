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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globalsCss = readFileSync(path.join(projectRoot, "src/app/globals.css"), "utf8");

function themeBlock(selector) {
  const start = globalsCss.indexOf(selector);
  assert.ok(start > -1, `missing block: ${selector}`);
  const open = globalsCss.indexOf("{", start);
  const close = globalsCss.indexOf("\n}", open);
  return globalsCss.slice(open, close);
}

function tokenValue(block, name) {
  const match = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `missing token --${name}`);
  return match[1].trim();
}

/*
  Several tokens are declared as `var(--other-token)` rather than a hex literal, so
  a contrast check has to follow the reference before it can measure anything.
*/
function resolvedToken(block, name) {
  const raw = tokenValue(block, name);
  const reference = raw.match(/^var\(--([a-z0-9-]+)\)$/i);
  return reference ? resolvedToken(block, reference[1]) : raw;
}

const lightBlock = themeBlock(":root {");

test("the light theme carries the brand ramp sampled from the logo", () => {
  assert.equal(tokenValue(lightBlock, "brand-mint"), "#00E7A0");
  assert.equal(tokenValue(lightBlock, "brand-spring"), "#47F170");
  assert.equal(tokenValue(lightBlock, "brand-chartreuse"), "#BEF817");
  assert.equal(tokenValue(lightBlock, "brand-lime"), "#D3FA05");
  assert.equal(tokenValue(lightBlock, "brand-ink"), "#067A52");
  assert.equal(tokenValue(lightBlock, "lime-ink"), "#3F6B00");
  assert.equal(tokenValue(lightBlock, "ink"), "#08120C");
});

test("the light theme still defines the editorial tokens the primitives need", () => {
  for (const name of ["brand-gradient", "brand-bloom", "surface-inverse"]) {
    assert.ok(tokenValue(lightBlock, name).length > 0, `--${name} must have a value`);
  }
  assert.match(tokenValue(lightBlock, "brand-gradient"), /linear-gradient/);
  assert.match(tokenValue(lightBlock, "brand-bloom"), /radial-gradient/);
});

test("the primary action puts ink on the neon fill, never white", () => {
  const background = resolvedToken(lightBlock, "action-bg");
  const foreground = resolvedToken(lightBlock, "action-fg");

  assert.notEqual(foreground.toLowerCase(), "#ffffff");
  assert.ok(
    contrastRatio(background, foreground) >= 4.5,
    `action-bg/action-fg is ${contrastRatio(background, foreground).toFixed(2)}:1, below AA`,
  );
});

test("brand text on light surfaces uses the darkened ink variants", () => {
  const background = tokenValue(lightBlock, "background");
  const surface = tokenValue(lightBlock, "surface");

  for (const token of ["brand-ink", "lime-ink"]) {
    for (const base of [background, surface]) {
      const ratio = contrastRatio(tokenValue(lightBlock, token), base);
      assert.ok(ratio >= 4.5, `--${token} on ${base} is ${ratio.toFixed(2)}:1, below AA`);
    }
  }
});

test("the raw neon is never usable as text on a light surface", () => {
  const surface = tokenValue(lightBlock, "surface");

  for (const token of ["brand-mint", "brand-lime"]) {
    const ratio = contrastRatio(tokenValue(lightBlock, token), surface);
    assert.ok(
      ratio < 4.5,
      `--${token} unexpectedly passes on ${surface}; the surfaces-only rule assumes it does not`,
    );
  }
});

test("ink reads on every neon stop in the ramp", () => {
  const ink = tokenValue(lightBlock, "ink");

  for (const token of ["brand-mint", "brand-spring", "brand-chartreuse", "brand-lime"]) {
    const ratio = contrastRatio(ink, tokenValue(lightBlock, token));
    assert.ok(ratio >= 7, `--ink on --${token} is ${ratio.toFixed(2)}:1, below AAA`);
  }
});

const darkBlock = themeBlock(':root[data-theme="dark"] {');

test("the dark theme defines the same brand token names as light", () => {
  for (const name of [
    "brand-mint",
    "brand-spring",
    "brand-chartreuse",
    "brand-lime",
    "brand-ink",
    "lime-ink",
    "ink",
    "brand-gradient",
    "brand-bloom",
    "surface-inverse",
  ]) {
    assert.ok(tokenValue(darkBlock, name).length > 0, `dark theme is missing --${name}`);
  }
});

test("the dark primary action also puts ink on the neon fill", () => {
  const background = resolvedToken(darkBlock, "action-bg");
  const foreground = resolvedToken(darkBlock, "action-fg");

  assert.notEqual(foreground.toLowerCase(), "#ffffff");
  assert.ok(
    contrastRatio(background, foreground) >= 4.5,
    `dark action-bg/action-fg is ${contrastRatio(background, foreground).toFixed(2)}:1`,
  );
});

test("the neon is legible as text on the dark canvas", () => {
  const background = tokenValue(darkBlock, "background");

  for (const token of ["brand-mint", "brand-lime"]) {
    const ratio = contrastRatio(tokenValue(darkBlock, token), background);
    assert.ok(ratio >= 7, `--${token} on the dark canvas is ${ratio.toFixed(2)}:1, below AAA`);
  }
});

test("body text meets AA in both themes", () => {
  for (const [label, block] of [["light", lightBlock], ["dark", darkBlock]]) {
    const ratio = contrastRatio(
      tokenValue(block, "foreground"),
      tokenValue(block, "background"),
    );
    assert.ok(ratio >= 4.5, `${label} body text is ${ratio.toFixed(2)}:1, below AA`);
  }
});

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("a first visit resolves to light regardless of the operating system setting", () => {
  const layout = source("src/app/layout.tsx");
  const toggle = source("src/components/layout/ThemeToggle.tsx");

  assert.doesNotMatch(layout, /prefers-color-scheme/);
  assert.doesNotMatch(toggle, /prefers-color-scheme/);
});

test("an explicit stored choice still wins over the light default", () => {
  const layout = source("src/app/layout.tsx");
  const toggle = source("src/components/layout/ThemeToggle.tsx");

  assert.match(layout, /localStorage\.getItem\("theme"\)/);
  assert.match(layout, /stored === "light" \|\| stored === "dark"/);
  assert.match(toggle, /stored === "light" \|\| stored === "dark"/);
});
