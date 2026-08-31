# Editorial Shells and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the six visual primitives into the shared shells and rebuild the home page as a full editorial landing page with a working image-compressor drop zone in the hero.

**Architecture:** The previous plan built `src/components/visual/*` and left them unimported, which is why the site's appearance barely moved. This plan consumes them. Three shared surfaces carry almost all the change — `CategoryGrid` (feeds the home and every category page), `ToolShell` (the template all 68 tool routes render through), and `HomeCatalog` (the home hero). Editing those three changes 91 routes without touching individual tools. The hero's drop zone reuses `FileDropzone` and the existing `@/lib/image-conversion` primitives, so it genuinely compresses rather than faking a result, and adds no new dependency.

**Tech Stack:** Next.js 16 (webpack), React 19, Tailwind CSS v4, `motion` for animation, `node:test` + `node:assert/strict`. TypeScript is stripped natively by Node 22, so `.mjs` tests import `.ts` directly.

**Spec:** `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md`

## Global Constraints

Copied verbatim from the spec and the preceding plan. Every task's requirements implicitly include these.

- **No new runtime dependencies.** `motion` is already present and is the only animation system.
- **No new web fonts.** Plus Jakarta Sans and JetBrains Mono are self-hosted via `next/font/google`.
- **No `filter: blur()`, `backdrop-blur`, or Tailwind `blur-*`** — anywhere, including inside comments; a guard test in `tests/visual-primitives.test.mjs` greps whole files.
- **No external assets** — no `https://` URLs, no `@font-face`, no remote images.
- **CLS:** every visual slot reserves its space before paint.
- **LCP** stays a text node (the hero headline), never an image.
- **JS budget:** total static JS must not exceed **3.56 MB**. Current measured value is 3.39 MB. This plan is the one that actually adds JS, because it imports the primitives for the first time.
- **`public/brahui/index.html` and `public/brahui/lexdetail.c6ebf98142d2.json` are FROZEN** (spec section 5a). No task may edit, import, or reimplement them — they hold a `speechSynthesis` voice-ranking engine, `.m4a` playback across 6,646 files, and a modal sheet system.
- **Contrast rule:** mint `#00E7A0` and greenyellow `#D3FA05` are surfaces only, always with `--ink` `#08120C` on top. Brand-as-text on a light surface must use `--brand-ink` `#067A52` / `--accent-700`, or `--lime-ink` `#3F6B00` / `--brand-700`.
- **Truthfulness:** never state a capability the code cannot perform. The hero must really compress; no fabricated before/after numbers.

**Verification after every task:** `npm run lint` and `node --test tests/*.test.mjs` must pass before the commit.

---

### Task 1: Category tiles replace paragraph cards

`CategoryTile` was built in the previous plan and imported by nothing. Wire it in. This single change alters the home page and all 10 category pages, because both render `CategoryGrid`.

**Files:**
- Modify: `src/components/CategoryGrid.tsx`
- Test: `tests/editorial-shells.test.mjs` (create)

**Interfaces:**
- Consumes: `CategoryTile({ category, toolCount })` from `@/components/visual/CategoryTile`; `categoryIcons` / `categoryTileStyles` / `categorySurfaceStyles` from `@/lib/data/category-visuals`.
- Produces: `CategoryGrid({ categories })` keeps its existing prop signature — callers are unchanged.

- [ ] **Step 1: Write the failing test**

Create `tests/editorial-shells.test.mjs`:

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: FAIL — `CategoryGrid.tsx` does not import `CategoryTile`.

- [ ] **Step 3: Write minimal implementation**

Replace the body of `src/components/CategoryGrid.tsx` with:

```typescript
"use client";

/*
  The category grid is rendered by the home page and by every category route, so
  its density sets how much of the catalogue a visitor can see at once. The
  paragraph card it used to render fitted three categories on a laptop screen;
  the tile fits all ten.

  Motion lives here rather than in CategoryTile so the tile stays a plain server
  component that any surface can render.
*/

import { motion, useReducedMotion } from "motion/react";
import CategoryTile from "@/components/visual/CategoryTile";
import { tools, type CategoryDefinition } from "@/lib/data/tools";

type CategoryGridProps = {
  categories: CategoryDefinition[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => {
        const toolCount = tools.filter((tool) => tool.category === category.slug).length;

        return (
          <motion.div
            key={category.slug}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            whileTap={reduceMotion ? undefined : { y: -1, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.55 }}
          >
            <CategoryTile category={category} toolCount={toolCount} />
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/CategoryGrid.tsx tests/editorial-shells.test.mjs
git commit -m "feat: render category tiles instead of paragraph cards"
```

---

### Task 2: Editorial section header primitive

Home and category pages both open sections with an eyebrow, a heading, and an optional aside. That markup is currently repeated inline. Extract it so the editorial treatment is applied once.

**Files:**
- Create: `src/components/visual/SectionHeader.tsx`
- Modify: `tests/visual-primitives.test.mjs` (add to `PRIMITIVES`)
- Test: `tests/editorial-shells.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `SectionHeader({ eyebrow, title, aside?, id?, className? }): JSX.Element`. `title` renders as an `<h2>`. `id` is applied to the heading so `aria-labelledby` can reference it.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to the `PRIMITIVES` array:

```javascript
  "src/components/visual/SectionHeader.tsx",
```

Append to `tests/editorial-shells.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/SectionHeader.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/SectionHeader.tsx`:

```typescript
/*
  One section opener for the whole site: a small brand eyebrow, the section
  heading, and an optional explanatory aside that sits beside the title on wide
  screens and stacks beneath it on narrow ones.

  The eyebrow uses --accent-700 rather than the raw brand ramp: mint and
  greenyellow are surface colours and measure about 1.2:1 as text on a light
  page, so they cannot carry words.
*/

import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  id?: string;
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  aside,
  id,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-700)]">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[var(--ink-900)] sm:text-3xl"
        >
          {title}
        </h2>
      </div>
      {aside ? (
        <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)] md:text-right">
          {aside}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-shells.test.mjs && node --test tests/visual-primitives.test.mjs`
Expected: both pass.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/SectionHeader.tsx tests/editorial-shells.test.mjs tests/visual-primitives.test.mjs
git commit -m "feat: add the SectionHeader editorial primitive"
```

---

### Task 3: Extract the hero compression helper

The hero needs to really compress a dropped image. Put that logic in a tested module before any UI depends on it, so the behaviour is verified rather than asserted by grep.

**Files:**
- Create: `src/lib/tools/hero-compress.ts`
- Test: `tests/hero-compress.test.mjs` (create)

**Interfaces:**
- Consumes: nothing at module scope. It receives an already-decoded bitmap-like source so it stays testable in Node.
- Produces:
  - `heroTargetDimensions(width: number, height: number, maxEdge?: number): { width: number; height: number }` — scales the longest edge down to `maxEdge` (default `1600`), preserving aspect ratio, never upscaling, always returning integers of at least 1.
  - `compressionSummary(originalBytes: number, compressedBytes: number): { ratio: number; savedBytes: number; savedPercent: number }` — `ratio` is `compressed / original` clamped to 0..1 for meter display; `savedPercent` is rounded to a whole number; both are 0 when `originalBytes <= 0`.

- [ ] **Step 1: Write the failing test**

Create `tests/hero-compress.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/hero-compress.test.mjs`
Expected: FAIL — cannot resolve `../src/lib/tools/hero-compress.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/tools/hero-compress.ts`:

```typescript
/*
  Pure helpers for the home page's hero compressor. They are deliberately free of
  DOM and canvas references so the arithmetic is unit-tested in Node — the hero
  makes a real claim about how much a file shrank, and a wrong number there is a
  false claim about the product rather than a cosmetic bug.
*/

export type HeroDimensions = {
  width: number;
  height: number;
};

export function heroTargetDimensions(
  width: number,
  height: number,
  maxEdge = 1600,
): HeroDimensions {
  const longest = Math.max(width, height);

  if (longest <= maxEdge) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type CompressionSummary = {
  ratio: number;
  savedBytes: number;
  savedPercent: number;
};

export function compressionSummary(
  originalBytes: number,
  compressedBytes: number,
): CompressionSummary {
  if (originalBytes <= 0) {
    return { ratio: 0, savedBytes: 0, savedPercent: 0 };
  }

  // Clamped so a file that grew renders a full meter rather than overflowing it,
  // and so the hero never reports a negative saving as a positive one.
  const ratio = Math.min(Math.max(compressedBytes / originalBytes, 0), 1);
  const savedBytes = Math.max(originalBytes - compressedBytes, 0);
  const savedPercent = Math.round((savedBytes / originalBytes) * 100);

  return { ratio, savedBytes, savedPercent };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/hero-compress.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tools/hero-compress.ts tests/hero-compress.test.mjs
git commit -m "feat: add tested arithmetic for the hero compressor"
```

---

### Task 4: The working hero drop zone

**Files:**
- Create: `src/components/visual/HeroCompressor.tsx`
- Modify: `tests/visual-primitives.test.mjs` (add to `PRIMITIVES`)
- Test: `tests/editorial-shells.test.mjs`

**Interfaces:**
- Consumes: `FileDropzone` from `@/components/tool/FileDropzone`; `BeforeAfter` from `@/components/visual/BeforeAfter`; `heroTargetDimensions` / `compressionSummary` from `@/lib/tools/hero-compress`; `exportCanvasAtQuality`, `formatBytes`, `getDrawingContext`, `loadImageFromUrl` from `@/lib/image-conversion`.
- Produces: `HeroCompressor(): JSX.Element` — a client component taking no props.

- [ ] **Step 1: Write the failing test**

In `tests/visual-primitives.test.mjs`, add to `PRIMITIVES`:

```javascript
  "src/components/visual/HeroCompressor.tsx",
```

Append to `tests/editorial-shells.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/visual/HeroCompressor.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/visual/HeroCompressor.tsx`:

```typescript
"use client";

/*
  A real compressor in the hero, not a picture of one.

  The home page's job is to get someone into a task. Making the first thing they
  see a working drop zone removes a whole navigation step, and the before/after
  it produces is genuine output — every figure shown is measured from the actual
  blob, because a fabricated saving would be a false claim about the product.

  It reuses the same helpers the full Image Compressor route uses, so there is
  one compression path rather than two that can drift apart. The full tool keeps
  the controls this deliberately omits: format choice, target size, dimensions.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import FileDropzone from "@/components/tool/FileDropzone";
import BeforeAfter from "@/components/visual/BeforeAfter";
import { compressionSummary, heroTargetDimensions } from "@/lib/tools/hero-compress";
import {
  exportCanvasAtQuality,
  formatBytes,
  getDrawingContext,
  loadImageFromUrl,
} from "@/lib/image-conversion";

type HeroResult = {
  originalBytes: number;
  compressedBytes: number;
  ratio: number;
  savedPercent: number;
  previewUrl: string;
  downloadName: string;
};

export default function HeroCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<HeroResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Object URLs outlive the render that made them, so they are tracked in a ref
  // and revoked on replacement and on unmount. Without this the hero leaks a
  // blob for every image a visitor tries.
  const previewUrlRef = useRef<string>("");

  const releasePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, []);

  useEffect(() => releasePreview, [releasePreview]);

  const handleFiles = useCallback(
    async (incoming: File[]) => {
      const file = incoming[0];
      if (!file) return;

      setFiles(incoming);
      setError("");
      setBusy(true);
      releasePreview();
      setResult(null);

      const sourceUrl = URL.createObjectURL(file);

      try {
        const image = await loadImageFromUrl(sourceUrl);
        const target = heroTargetDimensions(image.naturalWidth, image.naturalHeight);

        const canvas = document.createElement("canvas");
        canvas.width = target.width;
        canvas.height = target.height;

        const context = getDrawingContext(canvas);
        if (!context) {
          throw new Error("This browser did not provide a drawing context.");
        }

        context.drawImage(image, 0, 0, target.width, target.height);

        // exportCanvasAtQuality returns { blob, appliedQuality } and yields null
        // when the browser silently fell back to a different format, which is
        // exactly the case that would otherwise ship a mislabeled file.
        const encoded = await exportCanvasAtQuality(canvas, "image/webp", 0.72);
        if (!encoded) {
          throw new Error("This browser could not encode the image as WebP.");
        }

        const { blob } = encoded;
        const summary = compressionSummary(file.size, blob.size);
        const previewUrl = URL.createObjectURL(blob);
        previewUrlRef.current = previewUrl;

        setResult({
          originalBytes: file.size,
          compressedBytes: blob.size,
          ratio: summary.ratio,
          savedPercent: summary.savedPercent,
          previewUrl,
          downloadName: `${file.name.replace(/\.[^.]+$/, "")}-compressed.webp`,
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "That image could not be compressed in this browser.",
        );
      } finally {
        URL.revokeObjectURL(sourceUrl);
        setBusy(false);
      }
    },
    [releasePreview],
  );

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-lift)] sm:p-5">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp"
        files={files}
        onFiles={handleFiles}
        onError={setError}
        maxFileSize={25 * 1024 * 1024}
        label="Drop an image to compress"
        hint="JPG, PNG or WebP, up to 25 MB — it never leaves your device"
        disabled={busy}
      />

      <p aria-live="polite" className="sr-only">
        {busy ? "Compressing image" : result ? "Compression complete" : ""}
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--error-foreground)]">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4">
          <BeforeAfter
            beforeLabel="Original"
            afterLabel="Compressed"
            beforeValue={formatBytes(result.originalBytes)}
            afterValue={formatBytes(result.compressedBytes)}
            ratio={result.ratio}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={result.previewUrl}
              download={result.downloadName}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--action-bg)] px-4 text-sm font-bold text-[var(--action-fg)] hover:bg-[var(--action-bg-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            >
              Download {result.savedPercent}% smaller
            </a>
            <Link
              href="/tools/image/image-compressor"
              className="text-sm font-semibold text-[var(--accent-700)] underline underline-offset-4"
            >
              More options
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-shells.test.mjs && node --test tests/visual-primitives.test.mjs`
Expected: both pass.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

All four helpers were verified present in `src/lib/image-conversion.ts` before this
plan was written: `formatBytes(bytes: number)` at line 15, `loadImageFromUrl(url: string):
Promise<HTMLImageElement>` at 31, `getDrawingContext(canvas)` at 51, and
`exportCanvasAtQuality(canvas, outputMimeType, outputQuality?)` at 81.

Note the return shape, which is the easy mistake here: `exportCanvasAtQuality` resolves to
`CanvasExportResult | null` where `CanvasExportResult` is `{ blob: Blob; appliedQuality?: number }`
— **not** a bare `Blob`. It returns `null` when the browser silently fell back to another
format, and the code above destructures `{ blob }` accordingly. Do not call `.size` on the
returned object directly.

- [ ] **Step 6: Commit**

```bash
git add src/components/visual/HeroCompressor.tsx tests/editorial-shells.test.mjs tests/visual-primitives.test.mjs
git commit -m "feat: add a working image compressor for the hero"
```

---

### Task 5: The editorial home hero

**Files:**
- Modify: `src/components/HomeCatalog.tsx` — the hero block only, roughly lines 80–140
- Test: `tests/editorial-shells.test.mjs`

**Interfaces:**
- Consumes: `BrandBloom`, `HeroCompressor`, `SectionHeader`.
- Produces: no new exports. `HomeCatalog` keeps its current default export and takes no props.

- [ ] **Step 1: Write the failing test**

Append to `tests/editorial-shells.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: FAIL — `HomeCatalog.tsx` does not import `BrandBloom`.

- [ ] **Step 3: Write minimal implementation**

In `src/components/HomeCatalog.tsx`, add these imports beside the existing ones:

```typescript
import BrandBloom from "@/components/visual/BrandBloom";
import HeroCompressor from "@/components/visual/HeroCompressor";
```

Then replace the opening `<section className="pb-2 pt-4 text-center sm:pt-7">` block — from that tag down to and including the closing `</section>` that ends the hero — with:

```tsx
      <section className="relative isolate overflow-hidden pb-6 pt-6 sm:pt-10">
        <BrandBloom className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-mint)]" />
              {tools.length} focused tools · no sign-up
            </span>

            <h1 className="mt-5 text-[clamp(2.4rem,6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.045em] text-[var(--ink-900)]">
              Every tool you need,{" "}
              <span className="bg-[image:var(--brand-gradient)] bg-clip-text text-transparent">
                right in your browser
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg lg:mx-0">
              Convert, compress and edit files without uploading them anywhere. Processing
              happens on your device.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[var(--muted-foreground)] lg:justify-start">
              <span>✓ No account</span>
              <span>✓ Files stay local</span>
              <span>✓ Free to use</span>
            </div>
          </div>

          <HeroCompressor />
        </div>

        <div className="relative z-10 mt-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            size="lg"
            placeholder={`Search ${tools.length}+ tools…`}
            analyticsSource="home_catalog"
          />
          {searching ? (
            <div
              aria-live="polite"
              className="mx-auto mt-2 max-w-[720px] overflow-hidden rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-2 text-left shadow-[var(--shadow-soft)]"
            >
              <p className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
                {searchResults.length
                  ? `${searchResults.length} matching ${searchResults.length === 1 ? "tool" : "tools"}`
                  : "No matching tools"}
              </p>
              {suggestions.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm hover:bg-[var(--accent-50)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
                >
                  <span>
                    <span className="font-semibold text-[var(--ink-900)]">{tool.title}</span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">{tool.meta}</span>
                  </span>
                  <span className="text-[var(--accent-700)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
```

Leave everything below the hero — the tabs, the tool grid, the shortcuts list — exactly as it is. If the existing hero contains markup this replacement drops (for example the "Try" shortcut row), preserve it by appending it beneath the search block rather than deleting it, and say so in your report.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/editorial-shells.test.mjs`
Expected: PASS.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/HomeCatalog.tsx tests/editorial-shells.test.mjs
git commit -m "feat: rebuild the home hero around a working compressor"
```

---

### Task 6: Measure the budget after wiring

This is the plan that actually adds JavaScript, because the primitives are imported for the first time. Prove the ceiling holds.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md` — section 11

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: a recorded measurement.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exit 0, 91 routes.

- [ ] **Step 2: Measure**

```bash
find .next/static -name "*.js" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "JS: %d files, %.2f MB\n", n, s/1048576}'
find .next/static -name "*.css" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "CSS: %d files, %.1f KB\n", n, s/1024}'
```

Expected: JS at or below **3.56 MB**. If it exceeds the ceiling, STOP and report BLOCKED with the figure — the fix is a scoping decision about what the home page imports, not a size tweak.

- [ ] **Step 3: Confirm no external fonts or assets crept in**

```bash
grep -rn "fonts.googleapis\|@font-face" src/ || echo "no external fonts"
```

- [ ] **Step 4: Run the full verification set**

Run: `npm run lint && node --test tests/*.test.mjs && npm run audit:tools`
Expected: all pass. `npm run audit:outputs` is known to fail in this environment for want of `ffmpeg` — it fails identically on the baseline, so it is not a regression.

- [ ] **Step 5: Record**

Add a "Phase 3–4" column to the table in section 11 beside the existing baseline and Phase 1–2 columns. Do not alter the earlier figures.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-31-editorial-redesign-design.md
git commit -m "docs: record the phase 3-4 bundle measurement"
```

---

## Self-Review

**Spec coverage.** This plan implements spec section 6.4 (page architecture — home and the shared category grid) and consumes the section 6.2 primitives the previous plan left unwired. Section 6.3 (the eight tool-family shells), 6.5 (Brahui extraction), 6.6 (internal linking), and 6.7 (SEO application) remain out of scope and keep their own plans.

**Deliberate deviation.** Component tests assert on source text, because the repository has no React test renderer and adding one would breach the no-new-dependencies constraint. Task 3 exists specifically to counter that: the hero's arithmetic — the part that makes a factual claim to the visitor about how much their file shrank — is extracted into a plain TypeScript module and given real behavioural unit tests, including the file-grew and divide-by-zero cases.

**Known risk carried from the previous plan.** `src/components/tool/ToolCard.tsx` still holds a second, divergent icon set for the same 10 category slugs. Task 1 does not touch it, so a category's icon can still differ between a tool card and a category tile. It is scheduled for the tool-family-shells plan, where `ToolCard` is rebuilt.

**Not covered here, deliberately:** `ToolShell`, `Header`, and `Footer` are untouched. Rewriting the template all 68 tool routes share belongs with the family-shell work rather than being split across two plans.
