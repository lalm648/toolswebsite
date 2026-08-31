# Brahui Indexable Word List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put all 3,473 Brahui words and their meanings into the HTML of `/tools/dictionary/brahui-dictionary` as indexable text, so the site's best-ranking page stops being an empty iframe shell — without creating per-word URLs and without meaningful DOM cost.

**Architecture:** The words currently live only inside `public/brahui/index.html`, which is loaded in an `<iframe>`. Iframe content is not attributed to the parent document, so the page Google indexes contains zero of them — verified by fetching the route and finding no occurrence of `balla`, `grandmother`, `pira`, or `lexrow`. A build-time parser extracts the entries from that file and a server component renders them as **letter-grouped text blocks**: roughly 34 sections holding plain text rather than one element per entry. Measured: **102 DOM elements** and 47 KB gzipped for 27,320 indexable words, against 17,365 elements if each entry were its own markup. The framed app is untouched and remains the interactive surface.

**Tech Stack:** Next.js 16 (webpack, App Router, static prerender), React 19, Tailwind CSS v4, `node:test` + `node:assert/strict`. Node 22 strips TypeScript, so `.mjs` tests import `.ts` directly.

**Spec:** `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md` (section 6.5 — amended by this plan, see Deviations)

## Global Constraints

- **No new runtime dependencies.** No HTML-parser library — the extraction is a scoped string parse over a file we control.
- **No new web fonts. No external assets** (`https://`, `@font-face`, remote images).
- **No `filter: blur()`, `backdrop-blur`, or Tailwind `blur-*`** — a guard test greps whole files including comments.
- **`public/brahui/index.html` is READ-ONLY for this plan.** It is parsed, never written. Its speech, audio and modal engine must stay byte-identical: `speechSynthesis` 9, `getVoices` 1, `new Audio` 2, `AudioContext` 1, `localStorage` 9.
- **JS budget:** total static JS must not exceed **3.56 MB**. Currently 3.43 MB. This plan should add ~0 JS: the word list is server-rendered with no client component.
- **DOM budget:** the rendered word list must stay **under 200 elements**. That is the entire reason for the text-block shape; one element per entry is explicitly rejected.
- **Truthfulness:** every entry rendered must come from the file. No invented Brahui, no invented glosses.
- **Contrast rule:** mint `#00E7A0` and greenyellow `#D3FA05` are surfaces only. Brand-as-text on light uses `--accent-700` / `--brand-700`.

**Verification after every task:** `npm run lint` and `node --test tests/*.test.mjs` must pass before the commit.

---

### Task 1: The lexicon parser

Extract entries from the framed document. Pure function, real unit tests — this is the only part where a bug silently corrupts what search engines read.

**Files:**
- Create: `src/lib/data/brahui-lexicon.ts`
- Test: `tests/brahui-lexicon.test.mjs`

**Interfaces:**
- Consumes: nothing at module scope.
- Produces:
  - `type BrahuiEntry = { id: string; latin: string; script: string; pos: string; gloss: string; frequency: number }`
  - `parseBrahuiEntries(html: string): BrahuiEntry[]` — parses `<article class="lexrow" …>` elements. Attribute order must NOT be assumed; read each attribute independently. Entries missing `data-b` or `data-e` are skipped rather than emitted with empty fields.
  - `groupByLetter(entries: BrahuiEntry[]): Array<{ letter: string; entries: BrahuiEntry[] }>` — groups on the uppercased first character of `latin`; any entry whose first character is not A–Z groups under `"#"`. Groups are sorted with `"#"` first, then A–Z. Entries within a group keep source order.

- [ ] **Step 1: Write the failing test**

Create `tests/brahui-lexicon.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { groupByLetter, parseBrahuiEntries } from "../src/lib/data/brahui-lexicon.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Attribute order deliberately varies between rows, and one row carries data-t.
// A parser that assumes a fixed order silently drops entries — that exact bug
// already caused a wrong answer once, so it is pinned here.
const FIXTURE = `
<article class="lexrow" id="w-balla" data-b="balla" data-e="grandmother; old woman" data-p="n." data-c="noun" data-f="12" data-x="2"><span class="lex-ur ur" dir="rtl">بَلّہ</span><b lang="brh">balla</b><i>n.</i><span class="lex-en">grandmother; old woman</span></article>
<article class="lexrow" data-f="10" data-p="a." id="w-abad" data-t="Farsi" data-e="populated" data-b="ábád" data-c="qual"><span class="lex-ur ur" dir="rtl">آبَاد</span><b lang="brh">ábád</b></article>
<article class="lexrow" id="w-pira" data-b="píra" data-e="grandfather" data-p="n." data-c="noun" data-f="7"><span class="lex-ur ur" dir="rtl">پِیرہ</span></article>
<article class="lexrow" id="w-kon" data-b="-kon" data-e="like" data-p="a." data-c="gram" data-f="3"><span class="lex-ur ur" dir="rtl">کون</span></article>
<article class="lexrow" id="w-broken" data-p="n." data-c="noun"><span class="lex-ur ur" dir="rtl">؟</span></article>
`;

test("parseBrahuiEntries reads attributes regardless of their order", () => {
  const entries = parseBrahuiEntries(FIXTURE);
  const abad = entries.find((e) => e.id === "w-abad");

  assert.ok(abad, "an entry with attributes in a different order must still parse");
  assert.equal(abad.latin, "ábád");
  assert.equal(abad.gloss, "populated");
  assert.equal(abad.pos, "a.");
  assert.equal(abad.script, "آبَاد");
});

test("parseBrahuiEntries extracts every field including the script form", () => {
  const balla = parseBrahuiEntries(FIXTURE).find((e) => e.id === "w-balla");

  assert.deepEqual(balla, {
    id: "w-balla",
    latin: "balla",
    script: "بَلّہ",
    pos: "n.",
    gloss: "grandmother; old woman",
    frequency: 12,
  });
});

test("parseBrahuiEntries skips rows with no headword or no gloss", () => {
  const entries = parseBrahuiEntries(FIXTURE);

  assert.equal(entries.length, 4, "the row missing data-b and data-e must be dropped");
  assert.ok(!entries.some((e) => e.id === "w-broken"));
});

test("parseBrahuiEntries defaults a missing frequency to zero rather than NaN", () => {
  const entries = parseBrahuiEntries(
    `<article class="lexrow" id="w-x" data-b="x" data-e="y" data-p="n." data-c="noun"></article>`,
  );

  assert.equal(entries[0].frequency, 0);
});

test("groupByLetter buckets non-alphabetic headwords under #, sorted first", () => {
  const groups = groupByLetter(parseBrahuiEntries(FIXTURE));

  assert.equal(groups[0].letter, "#");
  assert.deepEqual(
    groups[0].entries.map((e) => e.latin),
    ["-kon"],
    "a headword starting with a hyphen is not a letter",
  );
  assert.deepEqual(
    groups.map((g) => g.letter),
    ["#", "A", "B", "P"],
  );
});

test("groupByLetter preserves source order inside a group", () => {
  const entries = parseBrahuiEntries(
    `<article class="lexrow" id="w-b2" data-b="bz" data-e="second" data-p="n." data-c="noun"></article>
     <article class="lexrow" id="w-b1" data-b="ba" data-e="first" data-p="n." data-c="noun"></article>`,
  );
  const group = groupByLetter(entries).find((g) => g.letter === "B");

  assert.deepEqual(group.entries.map((e) => e.gloss), ["second", "first"]);
});

test("the real lexicon file parses to the full corpus", () => {
  const html = readFileSync(path.join(projectRoot, "public/brahui/index.html"), "utf8");
  const entries = parseBrahuiEntries(html);

  assert.equal(entries.length, 3473);
  assert.ok(entries.every((e) => e.latin.length > 0 && e.gloss.length > 0));

  // Spot-check words a Brahui speaker confirmed, so a future regeneration that
  // loses them fails here instead of silently shipping.
  const byLatin = new Map(entries.map((e) => [e.latin, e]));
  assert.equal(byLatin.get("balla").gloss, "grandmother; old woman");
  assert.equal(byLatin.get("píra").gloss, "grandfather");
  assert.equal(byLatin.get("sálum").gloss, "son-in-law");
});

test("the removed Urdu kinship loanwords have not come back", () => {
  const html = readFileSync(path.join(projectRoot, "public/brahui/index.html"), "utf8");

  for (const loan of ["dádí", "dádá", "náná", "nání", "phuphí", "xálá", "damád"]) {
    assert.ok(
      !html.includes(`{br:'${loan}'`),
      `${loan} is Urdu, not Brahui, and was removed on a speaker's correction`,
    );
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: FAIL — cannot resolve `../src/lib/data/brahui-lexicon.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/data/brahui-lexicon.ts`:

```typescript
/*
  Extracts the Brahui lexicon out of public/brahui/index.html so the words can be
  rendered into the route's own HTML.

  Why this exists: the dictionary is served in an iframe, and iframe content is
  not attributed to the parent document. The page Google indexes therefore holds
  none of the 3,473 words — the site's best-ranking page is an empty shell.

  Attributes are read INDEPENDENTLY rather than by a single ordered pattern. The
  source file does not emit them in a stable order (some rows carry data-t, some
  do not), and an order-assuming parser silently drops rows — a bug that already
  produced a confidently wrong answer once.

  Read-only: this module never writes to the source file.
*/

export type BrahuiEntry = {
  id: string;
  latin: string;
  script: string;
  pos: string;
  gloss: string;
  frequency: number;
};

function readAttribute(fragment: string, name: string): string {
  const match = fragment.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : "";
}

export function parseBrahuiEntries(html: string): BrahuiEntry[] {
  const entries: BrahuiEntry[] = [];

  for (const chunk of html.split('<article class="lexrow"').slice(1)) {
    const end = chunk.indexOf("</article>");
    const fragment = end === -1 ? chunk : chunk.slice(0, end);

    const latin = readAttribute(fragment, "data-b");
    const gloss = readAttribute(fragment, "data-e");

    // A row without a headword or a meaning is not a dictionary entry. Emitting
    // it would put empty lines into the indexable text.
    if (!latin || !gloss) continue;

    const scriptMatch = fragment.match(/dir="rtl">([^<]*)</);
    const frequency = Number.parseInt(readAttribute(fragment, "data-f"), 10);

    entries.push({
      id: readAttribute(fragment, "id"),
      latin,
      script: scriptMatch ? scriptMatch[1] : "",
      pos: readAttribute(fragment, "data-p"),
      gloss,
      frequency: Number.isNaN(frequency) ? 0 : frequency,
    });
  }

  return entries;
}

export type BrahuiLetterGroup = {
  letter: string;
  entries: BrahuiEntry[];
};

export function groupByLetter(entries: BrahuiEntry[]): BrahuiLetterGroup[] {
  const groups = new Map<string, BrahuiEntry[]>();

  for (const entry of entries) {
    const first = entry.latin.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const bucket = groups.get(letter);
    if (bucket) bucket.push(entry);
    else groups.set(letter, [entry]);
  }

  return [...groups.entries()]
    .map(([letter, grouped]) => ({ letter, entries: grouped }))
    .sort((a, b) => {
      if (a.letter === "#") return -1;
      if (b.letter === "#") return 1;
      return a.letter.localeCompare(b.letter);
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Verify the whole suite and lint**

Run: `npm run lint && node --test tests/*.test.mjs`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/brahui-lexicon.ts tests/brahui-lexicon.test.mjs
git commit -m "feat: add a build-time parser for the Brahui lexicon"
```

---

### Task 2: The indexable word list component

**Files:**
- Create: `src/components/tool/BrahuiWordIndex.tsx`
- Test: `tests/brahui-lexicon.test.mjs`

**Interfaces:**
- Consumes: `BrahuiLetterGroup` from `@/lib/data/brahui-lexicon`.
- Produces: `BrahuiWordIndex({ groups }: { groups: BrahuiLetterGroup[] }): JSX.Element` — a server component. No `"use client"`, no hooks, no event handlers.

**The shape is the whole point.** One element per entry would cost 17,365 DOM elements. Each letter group renders ONE `<p>` holding all its entries as text, so the finished list is roughly 102 elements for 27,320 indexable words.

- [ ] **Step 1: Write the failing test**

Append to `tests/brahui-lexicon.test.mjs`:

```javascript
function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the word index renders text blocks, not one element per entry", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  // Mapping entries to elements is the exact thing this component exists to avoid.
  assert.doesNotMatch(
    component,
    /entries\.map\([^)]*=>\s*\(?\s*</,
    "entries must be joined into text, never mapped to elements",
  );
  assert.match(component, /\.join\(/, "entries are joined into a text block");
  assert.match(component, /groups\.map/, "one block per letter group is expected");
});

test("the word index is a server component and ships no JavaScript", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  assert.doesNotMatch(component, /"use client"/);
  assert.doesNotMatch(component, /useState|useEffect|onClick|onChange/);
});

test("the word index marks the Brahui script with language and direction", () => {
  const component = source("src/components/tool/BrahuiWordIndex.tsx");

  // Mixed Latin and Arabic on one line renders in the wrong visual order without
  // an isolate. Unicode isolates cost zero DOM elements, unlike a wrapper span.
  assert.match(component, /\\u2068|⁨/, "script forms need a first-strong isolate");
  assert.match(component, /\\u2069|⁩/, "and a matching pop-directional-isolate");
  assert.match(component, /lang="brh"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: FAIL — `ENOENT` for `src/components/tool/BrahuiWordIndex.tsx`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/tool/BrahuiWordIndex.tsx`:

```typescript
/*
  The full Brahui word list as indexable text.

  Shape matters more than styling here. Rendering one element per entry would put
  roughly 17,400 elements on the page; joining each letter's entries into a single
  text block costs about 102 elements for the same 27,320 words, and halves the
  transferred bytes. Search engines read text, not markup depth.

  Each line is "latin — script — pos — gloss". The script form is wrapped in
  Unicode first-strong isolates (U+2068 … U+2069) rather than a <span dir="rtl">,
  because an isolate is a character and costs no DOM element, while still stopping
  the Arabic from reordering the Latin around it.

  A server component with no interactivity: it adds no JavaScript to the bundle.
*/

import type { BrahuiLetterGroup } from "@/lib/data/brahui-lexicon";

const ISOLATE_START = "⁨";
const ISOLATE_END = "⁩";

function formatEntry(entry: BrahuiLetterGroup["entries"][number]): string {
  const script = entry.script ? ` ${ISOLATE_START}${entry.script}${ISOLATE_END}` : "";
  const pos = entry.pos ? ` ${entry.pos}` : "";
  return `${entry.latin}${script}${pos} — ${entry.gloss}`;
}

export default function BrahuiWordIndex({ groups }: { groups: BrahuiLetterGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <section
      aria-labelledby="brahui-word-index"
      className="rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 sm:p-6"
    >
      <h2
        id="brahui-word-index"
        className="text-xl font-bold tracking-[-0.02em] text-[var(--ink-900)]"
      >
        All {total.toLocaleString()} Brahui words, A–Z
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
        Every headword with its Brahui script, part of speech and English meaning.
        Use your browser&rsquo;s find (Ctrl+F) to jump to a word, or search inside the
        dictionary above.
      </p>

      {groups.map((group) => (
        <div key={group.letter} className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-700)]">
            {group.letter}
          </h3>
          <p
            lang="brh"
            className="mt-1.5 whitespace-pre-line text-sm leading-7 text-[var(--foreground)]"
          >
            {group.entries.map(formatEntry).join("\n")}
          </p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: PASS, 11 tests.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/tool/BrahuiWordIndex.tsx tests/brahui-lexicon.test.mjs
git commit -m "feat: add the indexable Brahui word list component"
```

---

### Task 3: Render the list on the route

**Files:**
- Modify: `src/components/tool/ToolShell.tsx` — add an optional slot after `WorkbenchFrame` (line 263)
- Modify: `src/app/tools/dictionary/brahui-dictionary/page.tsx`
- Test: `tests/brahui-lexicon.test.mjs`

**Interfaces:**
- Consumes: `parseBrahuiEntries`, `groupByLetter`, `BrahuiWordIndex`.
- Produces: `ToolShell` gains `afterWorkbench?: ReactNode`, rendered directly after `<WorkbenchFrame>`. Every existing caller omits it and is unaffected.

- [ ] **Step 1: Write the failing test**

Append to `tests/brahui-lexicon.test.mjs`:

```javascript
test("ToolShell exposes a slot after the workbench without breaking callers", () => {
  const shell = source("src/components/tool/ToolShell.tsx");

  assert.match(shell, /afterWorkbench\?: ReactNode/, "the slot must be optional");
  assert.match(shell, /\{afterWorkbench\}/);
});

test("the Brahui route renders the word list into its own HTML", () => {
  const page = source("src/app/tools/dictionary/brahui-dictionary/page.tsx");

  assert.match(page, /from "@\/components\/tool\/BrahuiWordIndex"/);
  assert.match(page, /parseBrahuiEntries/);
  assert.match(page, /groupByLetter/);
  assert.match(page, /readFileSync/, "the lexicon is read at build time");
  // A client component here would ship 900 KB of words as JavaScript.
  assert.doesNotMatch(page, /"use client"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: FAIL — `afterWorkbench` is not in `ToolShell.tsx`.

- [ ] **Step 3: Write minimal implementation**

In `src/components/tool/ToolShell.tsx`, add to `ToolShellProps`:

```typescript
  /* Rendered directly after the workbench. Used by the Brahui route to put its
     word list into the page's own HTML, since iframe content is not attributed
     to the parent document. Optional: every other tool omits it. */
  afterWorkbench?: ReactNode;
```

Add `afterWorkbench,` to the destructured parameters, and render it immediately after the workbench:

```tsx
        <WorkbenchFrame category={category?.slug}>{children}</WorkbenchFrame>

        {afterWorkbench}
```

Then replace `src/app/tools/dictionary/brahui-dictionary/page.tsx` with:

```typescript
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import BrahuiDictionaryTool from "@/components/tool/BrahuiDictionaryTool";
import BrahuiWordIndex from "@/components/tool/BrahuiWordIndex";
import ToolShell from "@/components/tool/ToolShell";
import { groupByLetter, parseBrahuiEntries } from "@/lib/data/brahui-lexicon";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("brahui-dictionary");

/*
  Read at module scope so the parse happens once during the static build, not per
  request. The route is prerendered, so this file never runs in a browser and the
  words ship as HTML rather than as JavaScript.
*/
const lexiconHtml = readFileSync(
  path.join(process.cwd(), "public/brahui/index.html"),
  "utf8",
);
const wordGroups = groupByLetter(parseBrahuiEntries(lexiconHtml));

export default function BrahuiDictionaryPage() {
  return (
    <ToolShell
      eyebrow="Brahui language"
      /* Must match the registry title exactly — ToolShell looks the tool up by it. */
      title="Brahui Dictionary & Learning App"
      description="Search 3,473 Brahui words in English, romanised Brahui, or Urdu script. Read cited example sentences, hear pronunciation, and practise vocabulary in frequency order."
      afterWorkbench={<BrahuiWordIndex groups={wordGroups} />}
    >
      <BrahuiDictionaryTool />
    </ToolShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/brahui-lexicon.test.mjs`
Expected: PASS, 13 tests.

- [ ] **Step 5: Verify the whole suite, lint, and build**

Run: `npm run lint && node --test tests/*.test.mjs && npm run build`
Expected: all pass, build exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/tool/ToolShell.tsx src/app/tools/dictionary/brahui-dictionary/page.tsx tests/brahui-lexicon.test.mjs
git commit -m "feat: render the Brahui word list into the route's own HTML"
```

---

### Task 4: Prove it is indexable and measure the cost

The whole plan is a claim about what a crawler receives. Verify it against the served HTML rather than the source.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-editorial-redesign-design.md` — section 6.5 and section 11

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: a recorded measurement.

- [ ] **Step 1: Build and serve**

```bash
npm run build
npx next start -p 3400 &
```

Wait until `curl -s -o /dev/null http://localhost:3400` succeeds.

- [ ] **Step 2: Prove the words reach the crawler**

```bash
curl -s http://localhost:3400/tools/dictionary/brahui-dictionary > /tmp/brahui-after.html
echo "bytes:        $(wc -c < /tmp/brahui-after.html)"
echo "balla:        $(grep -c 'balla' /tmp/brahui-after.html)"
echo "grandmother:  $(grep -c 'grandmother' /tmp/brahui-after.html)"
echo "pira:         $(grep -c 'pira' /tmp/brahui-after.html)"
echo "salum:        $(grep -c 'salum' /tmp/brahui-after.html)"
```

Expected: every count at least 1. Before this plan they were all 0. If any is 0, STOP and report — the page is still an empty shell and the plan has not achieved its goal.

- [ ] **Step 3: Count the DOM cost**

```bash
node -e "
const fs=require('fs');
const h=fs.readFileSync('/tmp/brahui-after.html','utf8');
const i=h.indexOf('brahui-word-index');
const section=h.slice(h.lastIndexOf('<section',i), h.indexOf('</section>',i));
console.log('word-list elements:', (section.match(/<[a-z]/g)||[]).length);
console.log('page elements total:', (h.match(/<[a-z]/g)||[]).length);
"
```

Expected: the word-list section is under 200 elements. If it exceeds that, the component is rendering per-entry markup and the shape is wrong — report rather than accept it.

- [ ] **Step 4: Confirm the framed engine is untouched**

```bash
for m in speechSynthesis getVoices "new Audio" AudioContext localStorage; do
  printf "%-18s %s\n" "$m" "$(grep -o "$m" public/brahui/index.html | wc -l)"
done
```

Expected exactly: 9, 1, 2, 1, 9. Any difference means the frozen file was modified and must be reverted.

- [ ] **Step 5: Measure the bundle**

```bash
find .next/static -name "*.js" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "JS: %d files, %.2f MB\n", n, s/1048576}'
find .next/static -name "*.css" -type f -printf "%s\n" | awk '{s+=$1;n++} END{printf "CSS: %d files, %.1f KB\n", n, s/1024}'
```

Expected: JS at or below **3.56 MB** and essentially unchanged from 3.43 MB, because the word list is server-rendered. A large JS increase means the page became a client component — report it.

- [ ] **Step 6: Stop the server and record**

Kill the `next start` process. Then update the spec: amend section 6.5 to describe the single-page approach actually taken, and add the measured figures to section 11.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-08-31-editorial-redesign-design.md
git commit -m "docs: record the Brahui indexability measurement"
```

---

## Self-Review

**Spec coverage and a deliberate deviation.** Spec section 6.5 currently prescribes extracting the corpus into roughly 3,473 per-word routes. **The owner explicitly rejected that**, asking instead that the words become part of the existing Brahui route so one page ranks for these keywords. This plan implements the owner's decision, and Task 4 amends the spec to match rather than leaving it describing work that will not happen.

The tradeoff, stated plainly: per-word URLs would compete for long-tail "*[word]* meaning" queries that a single page cannot win as directly. Against that, 3,473 thin pages carry real thin-content risk, and one page holding 27,320 words of genuine dictionary content is a stronger, safer asset. The owner's call is reasonable and this plan does not relitigate it.

**Placeholder scan:** none. Every step carries the actual code or the actual command.

**Type consistency:** `BrahuiEntry` and `BrahuiLetterGroup` are defined in Task 1 and consumed with matching shapes in Tasks 2 and 3. `parseBrahuiEntries` and `groupByLetter` keep the same names throughout. `afterWorkbench` is introduced and consumed within Task 3.

**Testing honesty.** Task 1 gets real behavioural unit tests because a parser bug corrupts what search engines read. Tasks 2 and 3 are source-text assertions, matching the repository's established pattern given no React renderer is available under the no-new-dependencies constraint — but Task 4 compensates by verifying the actual served HTML, which is the claim that matters.

**Not covered here:** extending the `DefinedTermSet` schema from 25 entries to the full corpus, the tool-family shells, removing the URL shortener, and the per-tool SEO content. Each has its own plan.
