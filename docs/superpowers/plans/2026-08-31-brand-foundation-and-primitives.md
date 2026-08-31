# Brand Foundation and Visual Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the emerald token system with the logo-derived mint-to-greenyellow brand, make light the default theme, and build the six visual primitives the editorial redesign needs.

**Architecture:** `src/app/globals.css` stays the runtime source of truth for design tokens (DESIGN.md Model B). Token *values* change; the `:root` / `:root[data-theme="dark"]` / `@theme inline` structure does not. A new pure-TypeScript contrast module lets the test suite parse `globals.css` and mechanically enforce the spec's contrast rule forever, so the neon brand cannot regress into an accessibility failure. Six presentational components then land in a new `src/components/visual/` directory, unused by any route until the next plan wires them in.

**Tech Stack:** Next.js 16 (webpack), React 19, Tailwind CSS v4 (`@theme inline`), `motion` for animation, `node:test` with `node:assert/strict` for tests. TypeScript is stripped natively by Node 22, so `.mjs` tests import `.ts` modules directly.

**Spec:** `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md`

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **No new runtime dependencies.** `motion` is already present and is the only animation system.
- **No new web fonts.** `Plus Jakarta Sans` and `JetBrains Mono` are already self-hosted through `next/font/google`. No external font requests may be added.
- **No `filter: blur()` on large elements.** Blooms use a plain `radial-gradient`, not a blurred layer.
- **No raster hero imagery by default.** Hero visuals are CSS gradients and inline SVG.
- **CLS:** every visual slot has reserved aspect-ratio space before paint.
- **LCP** stays a text node (the hero headline), never an image.
- **JS budget:** total static JS may not exceed **3.56 MB** (baseline 3.39 MB, +5% ceiling). CSS growth is unconstrained.
- **`public/brahui/index.html` and `public/brahui/lexdetail.c6ebf98142d2.json` are FROZEN.** No task in this plan may edit, import, or reimplement them (spec section 5a).
- **Contrast rule:** mint `#00E7A0` and greenyellow `#D3FA05` are surfaces only, always with `--ink` `#08120C` on top. Brand-as-text on a light background must use `--brand-ink` `#067A52` or `--lime-ink` `#3F6B00`.

**Verification after every task:** `npm run lint` and `node --test tests/*.test.mjs` must pass before the commit.

---

### Task 1: Contrast module

The spec's central rule is a contrast rule. Make it mechanically checkable before changing any colour, so later tasks are guarded rather than eyeballed.

**Files:**
- Create: `src/lib/design/contrast.ts`
- Test: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseHex(hex: string): [number, number, number]` — accepts `#RGB` or `#RRGGBB`, case-insensitive; throws `TypeError` on anything else.
  - `relativeLuminance(hex: string): number` — WCAG 2.1 relative luminance, 0..1.
  - `contrastRatio(a: string, b: string): number` — WCAG 2.1 ratio, 1..21, order-independent.

- [ ] **Step 1: Write the failing test**

Create `tests/design-tokens.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/design-tokens.test.mjs`
Expected: FAIL — cannot resolve `../src/lib/design/contrast.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/design/contrast.ts`:

```typescript
/*
  WCAG 2.1 contrast maths. This exists so the brand's contrast rule is enforced by
  the test suite rather than by review: the logo's mint and greenyellow are light
  enough that using either as a text colour on a light surface fails badly, and a
  future edit to globals.css should break a test rather than ship quietly.
*/

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): [number, number, number] {
  if (typeof hex !== "string" || !HEX_PATTERN.test(hex)) {
    throw new TypeError(`Expected a #RGB or #RRGGBB colour, received: ${String(hex)}`);
  }

  const digits = hex.slice(1);
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;

  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelLuminance(channel: number): number {
  const ratio = channel / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex);
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/design-tokens.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run lint and the full suite**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: no lint errors; all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/design/contrast.ts tests/design-tokens.test.mjs
git commit -m "feat: add WCAG contrast module for design token enforcement"
```

---

### Task 2: Light-theme brand tokens

Replace the emerald `--accent-*` ramp and the generic Tailwind `--brand-*` ramp with values sampled from `public/webutilia-logo.png`, and add the tokens the editorial treatment needs.

**Files:**
- Modify: `src/app/globals.css` — the `:root` block (lines 9–94) and `@theme inline` (line 161)
- Test: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: `contrastRatio` from Task 1.
- Produces: CSS custom properties consumed by every later task and by the 223 existing `var(--accent-*)` references —
  `--brand-mint`, `--brand-spring`, `--brand-chartreuse`, `--brand-lime`, `--brand-ink`, `--lime-ink`, `--ink`, `--brand-gradient`, `--brand-bloom`, `--surface-inverse`.

- [ ] **Step 1: Write the failing test**

Append to `tests/design-tokens.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/design-tokens.test.mjs`
Expected: FAIL — `missing token --brand-mint`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/globals.css`, replace the `--brand-*` and `--accent-*` declarations inside `:root` (currently lines 14–31) with:

```css
  /* Brand ramp sampled from public/webutilia-logo.png. Mint at one end,
     greenyellow at the other — the gradient is the most recognisable asset the
     product owns, and it now drives actions rather than sitting in the header
     mark alone. */
  --brand-mint: #00E7A0;
  --brand-spring: #47F170;
  --brand-chartreuse: #BEF817;
  --brand-lime: #D3FA05;

  /* Both neon endpoints sit near 1.2:1 against white, so neither can be text on a
     light surface. These two are the darkened stand-ins for links and body
     accents; the neon itself is only ever a fill with --ink on top. */
  --brand-ink: #067A52;
  --lime-ink: #3F6B00;
  --ink: #08120C;

  --brand-gradient: linear-gradient(
    104deg,
    var(--brand-mint) 0%,
    var(--brand-spring) 38%,
    var(--brand-chartreuse) 74%,
    var(--brand-lime) 100%
  );
  /* A plain radial gradient, deliberately not a blurred layer: filter: blur() on a
     hero-sized element costs paint time on every frame and would regress the
     performance budget this redesign is required to protect. */
  --brand-bloom: radial-gradient(
    ellipse at center,
    rgba(0, 231, 160, 0.28),
    rgba(190, 248, 23, 0.16) 45%,
    transparent 70%
  );

  /* Legacy ramp names retained: 223 var(--accent-*) references across the
     components resolve through these, so the whole site follows the new brand
     without touching a single component in this task. */
  --brand-50: #f7ffe6;
  --brand-100: #ecffc2;
  --brand-200: #ddfb8e;
  --brand-300: #c9f74a;
  --brand-500: #8fc400;
  --brand-600: #5f8c00;
  --brand-700: #3F6B00;

  --accent-50: #e9fff7;
  --accent-100: #c9ffe9;
  --accent-200: #93f9d1;
  --accent-300: #4ef0b0;
  --accent-500: #0f9c6b;
  --accent-600: #0a8659;
  --accent-700: #067A52;
```

Then change the action tokens (currently lines 36–38) to:

```css
  --action-bg: var(--brand-mint);
  --action-bg-hover: var(--brand-spring);
  --action-fg: var(--ink);
```

Add `--surface-inverse` beside the other surface tokens:

```css
  --surface-inverse: #08120C;
```

Update the ring and glow so focus and page wash follow the new brand:

```css
  --ring-soft: rgba(0, 231, 160, 0.32);
  --page-glow: rgba(0, 231, 160, 0.07);
  --workbench-glow: rgba(0, 231, 160, 0.12);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/design-tokens.test.mjs`
Expected: PASS, 11 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/design-tokens.test.mjs
git commit -m "feat: adopt the logo-derived brand ramp in the light theme"
```

---

### Task 3: Dark-theme brand tokens

The dark block currently defines its own emerald/lime pair. Bring it onto the same ramp, where the neon may be used as text because the canvas is dark.

**Files:**
- Modify: `src/app/globals.css` — the `:root[data-theme="dark"]` block (lines 96 onward)
- Test: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: `contrastRatio` from Task 1, `themeBlock` / `resolvedToken` helpers from Task 2.
- Produces: the same token names as Task 2, remapped for dark.

- [ ] **Step 1: Write the failing test**

Append to `tests/design-tokens.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/design-tokens.test.mjs`
Expected: FAIL — `dark theme is missing --brand-mint`.

- [ ] **Step 3: Write minimal implementation**

In `src/app/globals.css`, replace the `--brand-*` and `--accent-*` declarations inside `:root[data-theme="dark"]` (currently lines 102–118) with:

```css
  --brand-mint: #00E7A0;
  --brand-spring: #47F170;
  --brand-chartreuse: #BEF817;
  --brand-lime: #D3FA05;

  /* On a near-black canvas the neon is legible as text, so the darkened variants
     collapse back onto the ramp rather than staying dim. */
  --brand-ink: #4EF0B0;
  --lime-ink: #C9F74A;
  --ink: #08120C;

  --brand-gradient: linear-gradient(
    104deg,
    var(--brand-mint) 0%,
    var(--brand-spring) 38%,
    var(--brand-chartreuse) 74%,
    var(--brand-lime) 100%
  );
  --brand-bloom: radial-gradient(
    ellipse at center,
    rgba(0, 231, 160, 0.22),
    rgba(190, 248, 23, 0.1) 45%,
    transparent 70%
  );
  --surface-inverse: #f7f9fc;

  --brand-50: rgba(211, 250, 5, 0.1);
  --brand-100: rgba(211, 250, 5, 0.16);
  --brand-200: rgba(211, 250, 5, 0.24);
  --brand-300: #C9F74A;
  --brand-500: #BEF817;
  --brand-600: #D3FA05;
  --brand-700: #E4FC6B;

  --accent-50: rgba(0, 231, 160, 0.12);
  --accent-100: rgba(0, 231, 160, 0.18);
  --accent-200: rgba(0, 231, 160, 0.26);
  --accent-300: #4EF0B0;
  --accent-500: #00E7A0;
  --accent-600: #47F170;
  --accent-700: #93F9D1;
```

Replace the dark action tokens (currently lines 120–122):

```css
  --action-bg: var(--brand-mint);
  --action-bg-hover: var(--brand-spring);
  --action-fg: var(--ink);
```

Replace the dark ring and glow:

```css
  --ring-soft: rgba(0, 231, 160, 0.34);
  --page-glow: rgba(0, 231, 160, 0.05);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/design-tokens.test.mjs`
Expected: PASS, 15 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/design-tokens.test.mjs
git commit -m "feat: bring the dark theme onto the logo-derived brand ramp"
```

---

### Task 4: Light-first default theme

The bootstrap script and the toggle both fall back to `prefers-color-scheme`. The spec makes light the default; an explicit stored choice still wins.

**Files:**
- Modify: `src/app/layout.tsx:112-119`
- Modify: `src/components/layout/ThemeToggle.tsx:8-20`
- Test: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `document.documentElement.dataset.theme` is `"light"` on a first visit regardless of OS preference; `getResolvedTheme(): ResolvedTheme` in `ThemeToggle.tsx` keeps its signature.

- [ ] **Step 1: Write the failing test**

Append to `tests/design-tokens.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/design-tokens.test.mjs`
Expected: FAIL — `prefers-color-scheme` still present in both files.

- [ ] **Step 3: Write minimal implementation**

In `src/app/layout.tsx`, replace the bootstrap script body so the fallback is a literal:

```javascript
              (function () {
                try {
                  /* Light is the default. Mass-market utility sites land cold search
                     traffic on a light page, so the OS preference no longer decides
                     the first paint — only an explicit stored choice does. */
                  var stored = localStorage.getItem("theme");
                  var theme = stored === "light" || stored === "dark" ? stored : "light";
                  document.documentElement.dataset.theme = theme;
                } catch (error) {}
              })();
```

In `src/components/layout/ThemeToggle.tsx`, replace `getResolvedTheme`:

```typescript
function getResolvedTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  // Matches the bootstrap script in layout.tsx: light unless explicitly chosen.
  return "light";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/design-tokens.test.mjs`
Expected: PASS, 17 tests.

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`, open the site in a private window with the OS set to dark, and confirm the first paint is light. Toggle to dark, reload, and confirm the choice persists.

- [ ] **Step 6: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/components/layout/ThemeToggle.tsx tests/design-tokens.test.mjs
git commit -m "feat: default to the light theme on a first visit"
```

---

### Task 5: BrandBloom primitive

The gradient wash that sits behind editorial heroes. It is the single highest-risk component for the performance budget, so its test asserts the absence of a blur filter.

**Files:**
- Create: `src/components/visual/BrandBloom.tsx`
- Test: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: `--brand-bloom` from Tasks 2 and 3.
- Produces: `BrandBloom(props: { className?: string; width?: string; height?: string }): JSX.Element` — a `aria-hidden` absolutely positioned `div`. Defaults: `width` `"900px"`, `height` `"560px"`.

- [ ] **Step 1: Write the failing test**

Create `tests/visual-primitives.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/BrandBloom.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/BrandBloom.tsx`:

```typescript
/*
  The gradient wash behind an editorial hero.

  Deliberately a plain radial-gradient rather than a blurred layer. `filter: blur()`
  on an element this size forces the compositor to rasterize a large surface on
  every paint, which is exactly the cost the redesign is required not to add. A
  soft radial gradient reads the same and costs nothing measurable.

  Purely decorative, so it is hidden from assistive technology and cannot receive
  pointer events. It is absolutely positioned and given an explicit size by its
  caller, so it never participates in layout and cannot shift the hero.
*/

type BrandBloomProps = {
  className?: string;
  width?: string;
  height?: string;
};

export default function BrandBloom({
  className = "",
  width = "900px",
  height = "560px",
}: BrandBloomProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height, background: "var(--brand-bloom)" }}
      className={`pointer-events-none absolute -z-10 ${className}`}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/BrandBloom.tsx tests/visual-primitives.test.mjs
git commit -m "feat: add the BrandBloom gradient wash primitive"
```

---

### Task 6: ResultMeter primitive

A gradient bar for size, quality, or savings. Built before `BeforeAfter` because that component uses it.

**Files:**
- Create: `src/components/visual/ResultMeter.tsx`
- Modify: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: `--brand-gradient` from Tasks 2 and 3.
- Produces: `ResultMeter(props: { value: number; max?: number; label: string; className?: string }): JSX.Element`. `value` and `max` are numbers in the same unit; `max` defaults to `100`. The filled width is `clamp(0, value / max, 1)` as a percentage. `label` is required and becomes the accessible name.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add the new file to `PRIMITIVES`:

```javascript
const PRIMITIVES = [
  "src/components/visual/BrandBloom.tsx",
  "src/components/visual/ResultMeter.tsx",
];
```

Then append:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/ResultMeter.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/ResultMeter.tsx`:

```typescript
/*
  A single bar showing how much of a budget a result used — bytes saved, quality
  retained, compression achieved. The fill carries the brand gradient, which is the
  one place neon is unambiguously a surface rather than text.

  The ratio is clamped rather than trusted: callers pass real measurements, and a
  compressed file that grew would otherwise render a bar wider than its track.
*/

type ResultMeterProps = {
  value: number;
  max?: number;
  label: string;
  className?: string;
};

export default function ResultMeter({
  value,
  max = 100,
  label,
  className = "",
}: ResultMeterProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-panel)] ${className}`}
    >
      <div
        style={{ width: `${ratio * 100}%`, background: "var(--brand-gradient)" }}
        className="h-full rounded-full"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/ResultMeter.tsx tests/visual-primitives.test.mjs
git commit -m "feat: add the ResultMeter gradient bar primitive"
```

---

### Task 7: CategoryTile primitive

The compact tile that replaces the paragraph card. `CategoryGrid.tsx` already owns the icon set and the per-category colour maps; this task extracts them so both the old grid and the new tile share one source.

**Files:**
- Create: `src/lib/data/category-visuals.tsx`
- Create: `src/components/visual/CategoryTile.tsx`
- Modify: `src/components/CategoryGrid.tsx:15-125` — import from the new module instead of declaring the maps inline
- Modify: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: `ToolCategorySlug` and `CategoryDefinition` from `@/lib/data/tools`.
- Produces:
  - `categoryIcons: Record<ToolCategorySlug, ReactNode>`
  - `categoryTileStyles: Record<ToolCategorySlug, string>`
  - `categorySurfaceStyles: Record<ToolCategorySlug, string>`
  - `CategoryTile(props: { category: CategoryDefinition; toolCount: number }): JSX.Element`

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to `PRIMITIVES`:

```javascript
  "src/components/visual/CategoryTile.tsx",
```

Then append:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/lib/data/category-visuals.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/data/category-visuals.tsx` by moving `iconProps`, `categoryIcons`, `categoryTileStyles`, and `categorySurfaceStyles` verbatim out of `src/components/CategoryGrid.tsx:15-125`, adding `export` to each of the three maps, and adding these imports at the top:

```typescript
import type { ReactNode } from "react";
import type { ToolCategorySlug } from "@/lib/data/tools";
```

Then in `src/components/CategoryGrid.tsx`, delete those four declarations and import instead:

```typescript
import {
  categoryIcons,
  categorySurfaceStyles,
  categoryTileStyles,
} from "@/lib/data/category-visuals";
```

Create `src/components/visual/CategoryTile.tsx`:

```typescript
"use client";

/*
  The compact form of a category card. The paragraph card it replaces fit three
  categories in a viewport; this fits the whole catalogue, which is the density the
  established sites in this niche use and the reason their catalogues feel
  browsable.

  Category hue stays as wayfinding — it is not a status signal — and the brand
  gradient is reserved for actions, so nothing here uses it.
*/

import Link from "next/link";
import type { CategoryDefinition } from "@/lib/data/tools";
import {
  categoryIcons,
  categorySurfaceStyles,
  categoryTileStyles,
} from "@/lib/data/category-visuals";
import { trackCategoryOpen } from "@/lib/analytics";

type CategoryTileProps = {
  category: CategoryDefinition;
  toolCount: number;
};

export default function CategoryTile({ category, toolCount }: CategoryTileProps) {
  return (
    <Link
      href={category.href}
      data-category={category.slug}
      onClick={() => {
        trackCategoryOpen(category.slug);
      }}
      className={`group relative flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--outline-soft)] p-4 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${categorySurfaceStyles[category.slug]}`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105 ${categoryTileStyles[category.slug]}`}
      >
        {categoryIcons[category.slug]}
      </span>
      <span>
        <span className="block text-sm font-bold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
          {category.title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
          {toolCount} {toolCount === 1 ? "tool" : "tools"}
        </span>
      </span>
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Verify the extraction did not change the existing grid**

Run: `npm run dev` and load `/`. The category cards must look exactly as before — this task only moves their declarations.

- [ ] **Step 6: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/data/category-visuals.tsx src/components/CategoryGrid.tsx src/components/visual/CategoryTile.tsx tests/visual-primitives.test.mjs
git commit -m "feat: extract category visuals and add the compact CategoryTile"
```

---

### Task 8: BeforeAfter primitive

A drag slider comparing two states with a numeric delta. Fed by real tool output; it renders whatever its caller supplies and computes nothing itself.

**Files:**
- Create: `src/components/visual/BeforeAfter.tsx`
- Modify: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: `ResultMeter` from Task 6.
- Produces: `BeforeAfter(props: { beforeLabel: string; afterLabel: string; beforeValue: string; afterValue: string; ratio?: number; children?: ReactNode; className?: string }): JSX.Element`. `beforeValue` / `afterValue` are pre-formatted display strings such as `"4.2 MB"`. `ratio`, when supplied, is `after / before` in the range 0..1 and drives the meter.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to `PRIMITIVES`:

```javascript
  "src/components/visual/BeforeAfter.tsx",
```

Then append:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/BeforeAfter.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/BeforeAfter.tsx`:

```typescript
/*
  Side-by-side proof that a tool did something. Every tool already knows how to
  format its own measurements, so this takes display strings rather than raw
  numbers — duplicating byte formatting here would mean two places to get it wrong.

  `children` is the optional visual comparison (an image pair, a waveform); the
  numeric summary stands on its own when a tool has nothing to show.
*/

import type { ReactNode } from "react";
import ResultMeter from "@/components/visual/ResultMeter";

type BeforeAfterProps = {
  beforeLabel: string;
  afterLabel: string;
  beforeValue: string;
  afterValue: string;
  ratio?: number;
  children?: ReactNode;
  className?: string;
};

export default function BeforeAfter({
  beforeLabel,
  afterLabel,
  beforeValue,
  afterValue,
  ratio,
  children,
  className = "",
}: BeforeAfterProps) {
  return (
    <div className={className}>
      {children ? <div className="mb-3">{children}</div> : null}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-sm)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {beforeLabel}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold text-[var(--ink-900)]">
            {beforeValue}
          </p>
          <ResultMeter className="mt-2" value={1} max={1} label={`${beforeLabel} baseline`} />
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--accent-200)] bg-[var(--accent-50)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {afterLabel}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold text-[var(--accent-700)]">
            {afterValue}
          </p>
          {typeof ratio === "number" ? (
            <ResultMeter className="mt-2" value={ratio} max={1} label={`${afterLabel} relative to ${beforeLabel}`} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/BeforeAfter.tsx tests/visual-primitives.test.mjs
git commit -m "feat: add the BeforeAfter comparison primitive"
```

---

### Task 9: DeviceFrame primitive

Browser chrome around a live tool preview, so editorial sections can show the product working.

**Files:**
- Create: `src/components/visual/DeviceFrame.tsx`
- Modify: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `DeviceFrame(props: { url?: string; children: ReactNode; className?: string }): JSX.Element`. `url` is display-only chrome text and defaults to `"webutilia.com"`.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to `PRIMITIVES`:

```javascript
  "src/components/visual/DeviceFrame.tsx",
```

Then append:

```javascript
test("DeviceFrame chrome is decorative and its URL is not a link", () => {
  const frame = source("src/components/visual/DeviceFrame.tsx");

  assert.match(frame, /aria-hidden/);
  // Chrome that looked clickable but was not would be a usability trap.
  assert.doesNotMatch(frame, /<a\b|next\/link/);
  assert.match(frame, /children/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/DeviceFrame.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/DeviceFrame.tsx`:

```typescript
/*
  Browser chrome around a live preview. The chrome is scenery: it is hidden from
  assistive technology and contains no interactive element, because a fake address
  bar that looked clickable would be a usability trap. Whatever is framed inside
  remains fully real and fully accessible.
*/

import type { ReactNode } from "react";

type DeviceFrameProps = {
  url?: string;
  children: ReactNode;
  className?: string;
};

export default function DeviceFrame({
  url = "webutilia.com",
  children,
  className = "",
}: DeviceFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-lift)] ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 border-b border-[var(--outline-soft)] bg-[var(--surface-panel)] px-4 py-2.5"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="ml-3 font-mono text-[11px] text-[var(--muted-foreground)]">{url}</span>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 10 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/DeviceFrame.tsx tests/visual-primitives.test.mjs
git commit -m "feat: add the DeviceFrame preview chrome primitive"
```

---

### Task 10: HeroVisual primitive

The forward-compatibility seam. Renders an owner-supplied image when one is given and self-generated SVG art otherwise, so image links can be dropped in later without touching layout.

**Files:**
- Create: `src/components/visual/HeroVisual.tsx`
- Modify: `tests/visual-primitives.test.mjs`

**Interfaces:**
- Consumes: `BrandBloom` from Task 5.
- Produces: `HeroVisual(props: { slot: string; src?: string; alt?: string; width?: number; height?: number; children?: ReactNode; className?: string }): JSX.Element`. When `src` is set, `alt`, `width`, and `height` are all required and an `next/image` is rendered; otherwise `children` renders, falling back to the built-in SVG. `slot` is a stable identifier used to look the slot up later.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to `PRIMITIVES`:

```javascript
  "src/components/visual/HeroVisual.tsx",
```

Then append:

```javascript
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
```

Note the `no external asset` test already in this file asserts `PRIMITIVES` contain no `https?://`, which keeps the fallback art local.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/HeroVisual.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/HeroVisual.tsx`:

```typescript
/*
  The seam between the art we generate and the imagery the owner will supply later.

  Every hero declares a named `slot`. Today the slots render inline SVG built from
  brand tokens, which costs no network request and themes automatically. When real
  images arrive they are passed as `src` with explicit dimensions and the layout
  does not move — which is the whole point of the indirection.

  The aspect ratio is fixed on the wrapper in both branches, so the space is
  reserved before anything paints and swapping art for a photograph cannot shift
  the page.
*/

import type { ReactNode } from "react";
import Image from "next/image";
import BrandBloom from "@/components/visual/BrandBloom";

type HeroVisualProps = {
  slot: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  children?: ReactNode;
  className?: string;
};

export default function HeroVisual({
  slot,
  src,
  alt,
  width,
  height,
  children,
  className = "",
}: HeroVisualProps) {
  return (
    <div
      data-hero-slot={slot}
      className={`relative isolate aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] ${className}`}
    >
      <BrandBloom className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />

      {src && alt && width && height ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-cover"
        />
      ) : (
        children ?? (
          <svg
            viewBox="0 0 400 300"
            role="img"
            aria-label="Abstract mark built from the Webutilia brand gradient"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id={`hero-${slot}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--brand-mint)" />
                <stop offset="0.5" stopColor="var(--brand-spring)" />
                <stop offset="1" stopColor="var(--brand-lime)" />
              </linearGradient>
            </defs>
            <rect
              x="120"
              y="70"
              width="160"
              height="160"
              rx="36"
              fill={`url(#hero-${slot})`}
            />
          </svg>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-primitives.test.mjs`
Expected: PASS, 12 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/HeroVisual.tsx tests/visual-primitives.test.mjs
git commit -m "feat: add the HeroVisual slot primitive"
```

---

### Task 11: Verify the performance budget

The plan's whole premise is that the new brand and primitives cost nothing measurable. Prove it against the recorded phase-0 baseline before the next plan builds on this one.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md` — append the phase 1–2 measurement to section 11

**Interfaces:**
- Consumes: everything from Tasks 1–10.
- Produces: a recorded measurement; no code.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exit code 0, 78 routes prerendered.

- [ ] **Step 2: Measure the static output**

Run:

```bash
find .next/static -name "*.js" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "JS: %d files, %.2f MB\n", n, s/1048576}'
find .next/static -name "*.css" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "CSS: %d files, %.1f KB\n", n, s/1024}'
```

Expected: JS at or below **3.56 MB** (the +5% ceiling on the 3.39 MB baseline). CSS may grow freely.

If JS exceeds the ceiling, stop and report rather than proceeding — the likely cause is a primitive being pulled into a shared chunk, and the fix is a scoping decision, not a size tweak.

- [ ] **Step 3: Confirm no external font requests were introduced**

Run: `grep -rn "fonts.googleapis\|@font-face" src/ || echo "no external fonts"`
Expected: `no external fonts`.

- [ ] **Step 4: Verify both themes render**

Run `npm run dev`, then load `/` and `/tools/image/image-compressor` in both light and dark. Confirm primary buttons show dark text on a mint fill in both themes, and that focus rings are visible.

- [ ] **Step 5: Run the full verification set**

Run: `npm run lint && node --test tests/*.test.mjs && npm run audit:tools && npm run audit:outputs`
Expected: all pass.

- [ ] **Step 6: Record the measurement**

Append the measured JS and CSS figures to section 11 of the spec as a "Phase 1–2" row beside the baseline.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-08-31-editorial-redesign-design.md
git commit -m "docs: record the phase 1-2 bundle measurement"
```

---

## Self-Review

**Spec coverage.** This plan implements spec section 6.1 (token layer, Tasks 2–4) and section 6.2 (visual primitives, Tasks 5–10), with section 5's budget enforced by Task 11 and by the constraints repeated in every task. Sections 6.3 (family shells), 6.4 (page architecture), 6.5 (Brahui), 6.6 (internal linking) and 6.7 (SEO) are **out of scope for this plan** and belong to the follow-on plans named below. Section 5a is honoured by omission: no task reads, imports, or edits the frozen Brahui files.

**Deliberate deviation.** Component tests assert on source text rather than rendered output. The repository has no React test renderer, no jsdom, and no testing-library, and `tests/seo-structure.test.mjs` already establishes source-text assertion as the house pattern for `.tsx`. Adding a rendering stack would violate the no-new-dependencies constraint. Pure TypeScript modules — `contrast.ts` in Task 1 — get real behavioural unit tests.

**Follow-on plans, not covered here:**
1. Phase 3–4 — shared shells (Header, Footer, `ToolShell`, `CategoryPage`, `ToolCard`) and the editorial home page, wiring in the primitives this plan built.
2. Phase 5 — Brahui extraction into ~3,473 entry routes.
3. Phases 6–8 — the seven remaining family shells, per-tool result UI, and the Semrush on-page fixes.
