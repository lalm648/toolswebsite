# Brahui Guided Course Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Brahui app's Learn tab with a linear course that teaches everyday words, then the person system one form at a time, backed by a generator that builds lessons from attested corpus paradigms and never shows a learner an unreviewed sentence.

**Architecture:** All content logic lives in testable ES modules under `scripts/course/` and is exercised by `node --test`. A CLI (`scripts/build-course.mjs`) runs them and emits a hashed `public/brahui/course.<hash>.json`. The app's course engine is added to the existing self-contained `public/brahui/index.html`, which fetches that JSON and drives lessons through the Leitner scheduler already in the file.

**Tech Stack:** Node 20+ ESM (`.mjs`), `node:test` + `node:assert/strict`, vanilla browser JS inside `public/brahui/index.html` (no framework, no bundler, no dependencies).

**Spec:** `docs/superpowers/specs/2026-09-20-brahui-course-design.md`

## Global Constraints

- **v1 is Units 0–6 only.** Units 7–11 are out of scope; the schema and generator must handle all twelve, but only 0–6 are emitted.
- **No new runtime dependencies.** `public/brahui/index.html` is self-contained by design and loads nothing from any other origin. Build scripts may use Node built-ins only.
- **Generated Brahui never reaches a learner unreviewed.** A lesson renders only items with `review: "ok"`. The generator never promotes an item's review status.
- **Never modify existing card ids.** `PROG.cards` keys for word items stay exactly as they are so saved progress and streaks survive. Sentence items use the `s:` namespace.
- **Existing SRS constants are fixed:** `PKEY='brahui:progress:v1'`, `BOXDAYS=[0,1,3,7,16,40]`, `MAXBOX=5`, `LEARNED_BOX=3`. Grades are `0` again, `1` hard, `2` good, `3` easy.
- **Content goes in JSON, not HTML.** `index.html` is already 1.17 MB; only the engine is inlined.
- **Test files are `tests/*.test.mjs`** and run via `npm test` (`node --test tests/*.test.mjs`).
- **Source data:** `public/brahui/lexdetail.c6ebf98142d2.json`, a `{ headword: { pg, ex: [[surface, gloss, translation, ref, id]] } }` map of 3,473 entries holding 5,205 examples.

---

### Task 1: Paradigm extraction

Harvest `stem → { tag: surfaceForm }` tables by aligning surface tokens to gloss tokens. This is the foundation every later task draws on.

**Files:**
- Create: `scripts/course/paradigms.mjs`
- Test: `tests/brahui-course-paradigms.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `alignExample(surface: string, gloss: string) → Array<{surface: string, gloss: string}> | null` — `null` when token counts disagree.
  - `harvestParadigms(examples: Array<[string, string, ...]>) → Map<string, Map<string, string>>` — stem to tag to surface form.
  - `personOf(tag: string) → string | null` — returns `'1SG'`, `'2PL'`, … or `null`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/brahui-course-paradigms.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import { alignExample, harvestParadigms, personOf } from "../scripts/course/paradigms.mjs";

test("an example whose surface and gloss have the same token count aligns pairwise", () => {
  const pairs = alignExample("kar-oŧ ne", "do-FUT.1SG you");
  assert.deepEqual(pairs, [
    { surface: "kar-oŧ", gloss: "do-FUT.1SG" },
    { surface: "ne", gloss: "you" },
  ]);
});

test("an example whose token counts disagree is refused rather than mis-aligned", () => {
  /*
    The corpus is transcribed by hand and some lines have a token more or less
    on one side. Aligning those anyway would attach a verb's gloss to its
    neighbour and teach a wrong form, so they are dropped.
  */
  assert.equal(alignExample("kar-oŧ ne dá", "do-FUT.1SG you"), null);
});

test("a verb's inflected forms are collected under its gloss stem", () => {
  const paradigms = harvestParadigms([
    ["kar-oŧ", "do-FUT.1SG"],
    ["kar-os", "do-FUT.2SG"],
    ["kar-ak", "do-IMP"],
  ]);

  const forms = paradigms.get("do");
  assert.equal(forms.get("FUT.1SG"), "kar-oŧ");
  assert.equal(forms.get("FUT.2SG"), "kar-os");
  assert.equal(forms.get("IMP"), "kar-ak");
});

test("the first attestation of a form wins, so one odd later line cannot displace it", () => {
  const paradigms = harvestParadigms([
    ["kar-oŧ", "do-FUT.1SG"],
    ["karr-oŧ", "do-FUT.1SG"],
  ]);

  assert.equal(paradigms.get("do").get("FUT.1SG"), "kar-oŧ");
});

test("trailing sentence punctuation is not part of the form", () => {
  const paradigms = harvestParadigms([["kar-oŧ.", "do-FUT.1SG"]]);
  assert.equal(paradigms.get("do").get("FUT.1SG"), "kar-oŧ");
});

test("only inflected tags are harvested, so case-marked nouns are ignored", () => {
  /*
    GEN, D/A and ALL mark nouns. A course unit on the person system must not
    pick up "life-GEN" as if it were a verb paradigm.
  */
  const paradigms = harvestParadigms([["zind-aná", "life-GEN"]]);
  assert.equal(paradigms.size, 0);
});

test("person and number are read off a compound tag", () => {
  assert.equal(personOf("COP.PRS.3SG"), "3SG");
  assert.equal(personOf("NEG.FUT.1SG"), "1SG");
  assert.equal(personOf("IMP"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-course-paradigms.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/course/paradigms.mjs'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// scripts/course/paradigms.mjs

/*
  The corpus carries interlinear glosses: every example is a surface line and a
  gloss line whose tokens correspond one to one.

    kar-oŧ      ne
    do-FUT.1SG  you

  That correspondence is the whole reason a grammar course is buildable from a
  folktale collection — it is what turns narrative prose into paradigm tables.
*/

/* Tags that mark an inflected verb. Case and derivation tags (GEN, D/A, ALL,
   ABL, LOC, ADJ) mark nouns and are deliberately excluded: a unit on the person
   system must not collect "life-GEN" as a verb form. */
const INFLECTED = /\b(PST|PRS|IPF|PRF|FUT|SBJV|IMP|COP|CVB|INF|NEG)\b/;

const PERSON = /\b([123])(SG|PL)\b/;

/* A gloss token is a verb form when it reads "stem-TAG" with an uppercase tag.
   The stem is the English gloss the corpus uses ("do", "become"), not Brahui. */
const FORM = /^([a-zA-ZÀ-ɏĀ-ſ]+)-([A-Z][A-Z0-9/.]*)$/;

export function alignExample(surface, gloss) {
  const s = String(surface || "").split(/\s+/).filter(Boolean);
  const g = String(gloss || "").split(/\s+/).filter(Boolean);
  if (!s.length || s.length !== g.length) return null;
  return s.map((token, i) => ({ surface: token, gloss: g[i] }));
}

export function personOf(tag) {
  const m = PERSON.exec(String(tag || ""));
  return m ? m[1] + m[2] : null;
}

export function harvestParadigms(examples) {
  const out = new Map();
  for (const example of examples) {
    const pairs = alignExample(example[0], example[1]);
    if (!pairs) continue;
    for (const { surface, gloss } of pairs) {
      const m = FORM.exec(gloss);
      if (!m) continue;
      const [, stem, tag] = m;
      if (!INFLECTED.test(tag)) continue;
      const form = surface.replace(/[.,!?;:]+$/, "");
      if (!form) continue;
      if (!out.has(stem)) out.set(stem, new Map());
      const forms = out.get(stem);
      /* First attestation wins — a later odd transcription must not displace
         a form the course has already been built around. */
      if (!forms.has(tag)) forms.set(tag, form);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/brahui-course-paradigms.test.mjs`
Expected: PASS, 7 tests

- [ ] **Step 5: Verify against the real corpus**

Run:
```bash
node -e "
import('./scripts/course/paradigms.mjs').then(async m => {
  const fs = await import('node:fs');
  const d = JSON.parse(fs.readFileSync('public/brahui/lexdetail.c6ebf98142d2.json','utf8'));
  const ex = Object.values(d).flatMap(v => (v && v.ex) || []);
  const p = m.harvestParadigms(ex);
  const rich = [...p].filter(([,f]) => f.size >= 4);
  console.log('examples', ex.length, 'stems', p.size, 'rich stems', rich.length);
});
"
```
Expected: `examples 5205`, and **at least 55 rich stems** (the reference run found 60). If rich stems is under 55, the alignment regressed — do not continue.

- [ ] **Step 6: Commit**

```bash
git add scripts/course/paradigms.mjs tests/brahui-course-paradigms.test.mjs
git commit -m "Extract Brahui verb paradigms from interlinear glosses"
```

---

### Task 2: The review ledger

Approvals must survive regeneration. Without this, every rebuild throws away the reviewer's work — which would make the review gate unusable and the whole design collapse.

**Files:**
- Create: `scripts/course/review.mjs`
- Create: `public/brahui/course-review.json`
- Test: `tests/brahui-course-review.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `itemFingerprint(item: {br: string, en: string}) → string` — stable across rebuilds, changes when the Brahui or the English changes.
  - `applyReviews(items: Array<Item>, ledger: {approved: Record<string,string>}) → Array<Item>` — sets `review: "ok"` on approved items, leaves the rest `"pending"`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/brahui-course-review.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import { itemFingerprint, applyReviews } from "../scripts/course/review.mjs";

test("the fingerprint depends on the Brahui and the English, not on the item id", () => {
  /*
    Ids are positional — "u2l1i3" — so they move whenever a unit is re-cut.
    Approval has to survive that, which means it keys on the sentence itself.
  */
  const a = itemFingerprint({ id: "u2l1i3", br: "kar-oŧ", en: "I will do" });
  const b = itemFingerprint({ id: "u4l2i9", br: "kar-oŧ", en: "I will do" });
  assert.equal(a, b);
});

test("changing the Brahui invalidates the fingerprint", () => {
  const a = itemFingerprint({ br: "kar-oŧ", en: "I will do" });
  const b = itemFingerprint({ br: "karr-oŧ", en: "I will do" });
  assert.notEqual(a, b);
});

test("an approved item is marked ok", () => {
  const item = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(item)]: "2026-09-20" } };

  const [out] = applyReviews([item], ledger);
  assert.equal(out.review, "ok");
});

test("an unapproved generated item stays pending", () => {
  const item = { br: "mar-oŧ", en: "I will become", src: "gen", review: "pending" };
  const [out] = applyReviews([item], { approved: {} });
  assert.equal(out.review, "pending");
});

test("an attested corpus item is ok without any approval", () => {
  /*
    A sentence the corpus contains is already native Brahui. Asking a speaker
    to re-approve the source text would make the queue unusable.
  */
  const item = { br: "mass-uŧa", en: "I become", src: "corp", review: "ok" };
  const [out] = applyReviews([item], { approved: {} });
  assert.equal(out.review, "ok");
});

test("an edited sentence loses its old approval", () => {
  const original = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(original)]: "2026-09-20" } };

  const edited = { br: "kar-oŧ", en: "I shall do", src: "gen", review: "pending" };
  const [out] = applyReviews([edited], ledger);
  assert.equal(out.review, "pending");
});

test("applyReviews does not mutate its input", () => {
  const item = { br: "kar-oŧ", en: "I will do", src: "gen", review: "pending" };
  const ledger = { approved: { [itemFingerprint(item)]: "2026-09-20" } };

  applyReviews([item], ledger);
  assert.equal(item.review, "pending");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-course-review.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/course/review.mjs'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// scripts/course/review.mjs
import { createHash } from "node:crypto";

/*
  Generated Brahui does not reach a learner until a speaker has approved it.
  The approvals live in public/brahui/course-review.json, which is committed,
  because the generator reruns constantly and the reviewer's work must not be
  thrown away with each rebuild.

  Approval keys on the sentence, not on the item id: ids are positional and
  move whenever a unit is re-cut, while the sentence is the thing that was
  actually judged. Edit either side of it and the approval lapses, which is the
  behaviour we want — a changed sentence has not been reviewed.
*/

export function itemFingerprint(item) {
  const br = String((item && item.br) || "").normalize("NFC").trim();
  const en = String((item && item.en) || "").normalize("NFC").trim().toLowerCase();
  return createHash("sha256").update(br + " " + en).digest("hex").slice(0, 16);
}

export function applyReviews(items, ledger) {
  const approved = (ledger && ledger.approved) || {};
  return items.map((item) => {
    /* Attested corpus text is native Brahui already; it needs no speaker check. */
    if (item.src === "corp") return { ...item, review: "ok" };
    const ok = Object.prototype.hasOwnProperty.call(approved, itemFingerprint(item));
    return { ...item, review: ok ? "ok" : "pending" };
  });
}
```

- [ ] **Step 4: Create the empty ledger**

```bash
cat > public/brahui/course-review.json <<'JSON'
{
  "_comment": "Speaker approvals for generated course sentences. Keyed by itemFingerprint (sha256 of Brahui + English, first 16 hex). Written by the review screen; read by scripts/build-course.mjs. Committed so approvals survive regeneration.",
  "approved": {}
}
JSON
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/brahui-course-review.test.mjs`
Expected: PASS, 7 tests

- [ ] **Step 6: Commit**

```bash
git add scripts/course/review.mjs tests/brahui-course-review.test.mjs public/brahui/course-review.json
git commit -m "Keep speaker approvals across course rebuilds"
```

---

### Task 3: Unit assembly

Turn paradigms and seed words into the Unit 0–6 structure the app renders.

**Files:**
- Create: `scripts/course/units.mjs`
- Test: `tests/brahui-course-units.test.mjs`

**Interfaces:**
- Consumes: `harvestParadigms`, `personOf` (Task 1); `applyReviews` (Task 2).
- Produces:
  - `UNITS: Array<{id, title, goal, forms: string[]}>` — the v1 unit map, ids `u0`…`u6`.
  - `buildUnits({paradigms, greetings, examples, ledger}) → {version: 1, units: Array<Unit>}`
  - `Unit = {id, title, goal, lessons: Array<Lesson>}`
  - `Lesson = {id, type: 'match'|'build'|'listen'|'paradigm'|'speak', items: Array<Item>}`
  - `Item = {id, br, en, gloss?, tiles?, src: 'corp'|'gen', ref?, review: 'ok'|'pending'}`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/brahui-course-units.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import { UNITS, buildUnits } from "../scripts/course/units.mjs";

const PARADIGMS = new Map([
  ["do", new Map([
    ["IPF.1SG", "kar-ena"], ["IPF.2SG", "kar-usa"], ["IPF.3SG", "kar-eka"],
    ["IPF.3PL", "kar-era"], ["IPF.1PL", "kar-ena"], ["FUT.2PL", "kar-ore"],
    ["COP.PRS.3SG", "e"],
  ])],
]);

const GREETINGS = [
  { br: "assalám", en: "hello" },
  { br: "mehrbání", en: "thank you" },
];

const EXAMPLES = [["kar-eka.", "do-IPF.3SG", "He does it.", "2.20 §232"]];

function build() {
  return buildUnits({
    paradigms: PARADIGMS,
    greetings: GREETINGS,
    examples: EXAMPLES,
    ledger: { approved: {} },
  });
}

test("v1 emits exactly units u0 through u6", () => {
  assert.deepEqual(UNITS.map((u) => u.id), ["u0", "u1", "u2", "u3", "u4", "u5", "u6"]);
});

test("unit 0 teaches greetings and explains no grammar", () => {
  const u0 = build().units.find((u) => u.id === "u0");
  assert.ok(u0.lessons.length > 0);
  const items = u0.lessons.flatMap((l) => l.items);
  assert.ok(items.some((i) => i.br === "assalám"));
  assert.ok(items.every((i) => !i.gloss), "unit 0 items carry no grammatical gloss");
});

test("third person plural is taught before first person plural", () => {
  /*
    3PL has 1,657 attested examples and 1PL has 350, so the thinner unit is
    sequenced later — its content leans hardest on generation, and the reviewer
    should meet it after seeing the generator's output on easier forms.
  */
  const ids = UNITS.map((u) => u.id);
  const u5 = UNITS.find((u) => u.id === "u5");
  const u6 = UNITS.find((u) => u.id === "u6");
  assert.ok(u5.forms.some((f) => f.includes("3PL")));
  assert.ok(u6.forms.some((f) => f.includes("1PL")));
  assert.ok(ids.indexOf("u5") < ids.indexOf("u6"));
});

test("a verbatim corpus sentence is marked corp and needs no approval", () => {
  const items = build().units.flatMap((u) => u.lessons).flatMap((l) => l.items);
  const attested = items.find((i) => i.br === "kar-eka");
  assert.equal(attested.src, "corp");
  assert.equal(attested.review, "ok");
  assert.equal(attested.ref, "2.20 §232");
});

test("a generated item is pending until approved", () => {
  const items = build().units.flatMap((u) => u.lessons).flatMap((l) => l.items);
  const generated = items.filter((i) => i.src === "gen");
  assert.ok(generated.length > 0, "the generator produced something");
  assert.ok(generated.every((i) => i.review === "pending"));
});

test("a paradigm lesson asks for one missing person slot", () => {
  const lesson = build().units
    .flatMap((u) => u.lessons)
    .find((l) => l.type === "paradigm");
  assert.ok(lesson, "a paradigm lesson exists");
  assert.ok(lesson.items.every((i) => typeof i.gloss === "string" && i.gloss.length));
});

test("item ids are unique across the whole course", () => {
  const ids = build().units.flatMap((u) => u.lessons).flatMap((l) => l.items).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a unit with no available forms emits no empty lessons", () => {
  /*
    2PL has 111 attested examples in the real corpus and can come back empty for
    a given verb. A lesson with nothing in it must not render.
  */
  const thin = buildUnits({
    paradigms: new Map([["do", new Map([["IPF.1SG", "kar-ena"]])]]),
    greetings: GREETINGS,
    examples: [],
    ledger: { approved: {} },
  });
  assert.ok(thin.units.every((u) => u.lessons.every((l) => l.items.length > 0)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/brahui-course-units.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/course/units.mjs'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// scripts/course/units.mjs
import { applyReviews } from "./review.mjs";

/*
  The v1 unit map. Ordered by grammatical form, with one exception at each end:
  unit 0 teaches greetings and no grammar at all, because a course that opens on
  the copula loses people before it teaches them anything; and 3PL (unit 5)
  precedes 1PL/2PL (unit 6) because the corpus attests 1,657 of the former and
  350/111 of the latter, so the thinnest unit is met last.
*/
export const UNITS = [
  { id: "u0", title: "Say hello",    goal: "Greet someone and thank them",        forms: [] },
  { id: "u1", title: "This is…",     goal: "Say what something is",               forms: ["COP.PRS.3SG"] },
  { id: "u2", title: "I",            goal: "Talk about yourself",                 forms: ["IPF.1SG", "PRS.1SG"] },
  { id: "u3", title: "You",          goal: "Ask someone a question",              forms: ["IPF.2SG", "PRS.2SG"] },
  { id: "u4", title: "He, she, it",  goal: "Talk about someone else",             forms: ["IPF.3SG", "PRS.3SG"] },
  { id: "u5", title: "They",         goal: "Talk about a group",                  forms: ["IPF.3PL", "PRS.3PL"] },
  { id: "u6", title: "We, you all",  goal: "Include yourself and address a group", forms: ["IPF.1PL", "PRS.1PL", "IPF.2PL", "FUT.2PL"] },
];

const clean = (s) => String(s || "").replace(/[.,!?;:]+$/, "").trim();

/* Attested surface forms, indexed by the tag they were glossed with, so a unit
   can prefer real corpus text over anything generated. */
function attestedByTag(examples) {
  const out = new Map();
  for (const ex of examples) {
    const surface = String(ex[0] || "").split(/\s+/).filter(Boolean);
    const gloss = String(ex[1] || "").split(/\s+/).filter(Boolean);
    if (!surface.length || surface.length !== gloss.length) continue;
    for (let i = 0; i < gloss.length; i++) {
      const m = /^([a-zA-ZÀ-ɏĀ-ſ]+)-([A-Z][A-Z0-9/.]*)$/.exec(gloss[i]);
      if (!m) continue;
      const key = m[2];
      if (!out.has(key)) out.set(key, []);
      out.get(key).push({ br: clean(surface[i]), en: ex[2] || "", gloss: gloss[i], ref: ex[3] || "" });
    }
  }
  return out;
}

function lesson(id, type, items) {
  return { id, type, items };
}

export function buildUnits({ paradigms, greetings, examples, ledger }) {
  const attested = attestedByTag(examples || []);
  const units = [];

  for (const spec of UNITS) {
    const lessons = [];

    if (spec.id === "u0") {
      /* No gloss on unit 0 items: the learner is not being taught grammar yet,
         and a tag on screen would say otherwise. */
      const items = (greetings || []).map((g, i) => ({
        id: `${spec.id}l1i${i}`, br: clean(g.br), en: g.en, src: "corp", review: "ok",
      }));
      if (items.length) {
        lessons.push(lesson(`${spec.id}l1`, "match", items));
        lessons.push(lesson(`${spec.id}l2`, "speak", items.slice(0, 4)));
      }
    } else {
      const matchItems = [];
      const paradigmItems = [];

      for (const tag of spec.forms) {
        const real = attested.get(tag) || [];
        if (real.length) {
          real.slice(0, 6).forEach((r, i) => {
            matchItems.push({
              id: `${spec.id}l1i${matchItems.length}`,
              br: r.br, en: r.en, gloss: r.gloss, ref: r.ref, src: "corp", review: "ok",
            });
          });
        }
        for (const [stem, forms] of paradigms) {
          const form = forms.get(tag);
          if (!form) continue;
          paradigmItems.push({
            id: `${spec.id}l2i${paradigmItems.length}`,
            br: clean(form), en: `${stem} (${tag})`, gloss: `${stem}-${tag}`,
            src: "gen", review: "pending",
          });
        }
      }

      if (matchItems.length) lessons.push(lesson(`${spec.id}l1`, "match", matchItems));
      if (paradigmItems.length) lessons.push(lesson(`${spec.id}l2`, "paradigm", paradigmItems));
      if (matchItems.length) lessons.push(lesson(`${spec.id}l3`, "listen", matchItems.slice(0, 5)));
    }

    /* A lesson with no items must not render, and a unit with no lessons is
       dropped rather than shown empty. */
    const kept = lessons
      .map((l) => ({ ...l, items: applyReviews(l.items, ledger || { approved: {} }) }))
      .filter((l) => l.items.length > 0);

    units.push({ id: spec.id, title: spec.title, goal: spec.goal, lessons: kept });
  }

  return { version: 1, units };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/brahui-course-units.test.mjs`
Expected: PASS, 8 tests

- [ ] **Step 5: Run the whole suite to check nothing regressed**

Run: `npm test`
Expected: all existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add scripts/course/units.mjs tests/brahui-course-units.test.mjs
git commit -m "Assemble Brahui course units from paradigms and greetings"
```

---

### Task 4: The generator CLI

Wire the modules into a script that reads the real corpus and writes the hashed course file.

**Files:**
- Create: `scripts/build-course.mjs`
- Modify: `package.json` (add `build:course` script)
- Modify: `public/brahui/index.html` (add the `COURSEREV` marker line)

**Interfaces:**
- Consumes: `harvestParadigms` (Task 1), `applyReviews` (Task 2), `buildUnits`, `UNITS` (Task 3).
- Produces: `public/brahui/course.<hash>.json`; a rewritten `const COURSEREV='<hash>';` line in `index.html`.

- [ ] **Step 1: Add the marker line to index.html**

Find the line `const AUDIO_DIR='audio/';` in `public/brahui/index.html` and insert immediately above it:

```javascript
/* build-course.mjs rewrites the next line. The hash names the course file, so a
   rebuild invalidates the cached copy without any cache-busting query. */
const COURSEREV='';
```

- [ ] **Step 2: Write the generator**

```javascript
// scripts/build-course.mjs
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { harvestParadigms } from "./course/paradigms.mjs";
import { buildUnits } from "./course/units.mjs";

/*
  Builds public/brahui/course.<hash>.json from the corpus, the same way
  build-audio.js builds the clip set: read data, write a hashed asset, rewrite a
  marked line in index.html so the app knows which file to fetch.

  Run: npm run build:course
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const BRAHUI = path.join(ROOT, "public", "brahui");
const HTML = path.join(BRAHUI, "index.html");
const LEDGER = path.join(BRAHUI, "course-review.json");

function readLexdetail() {
  const name = fs.readdirSync(BRAHUI).find((f) => /^lexdetail\..*\.json$/.test(f));
  if (!name) throw new Error("no lexdetail.<hash>.json in public/brahui");
  return JSON.parse(fs.readFileSync(path.join(BRAHUI, name), "utf8"));
}

/* Unit 0's words come from the seed list in index.html, which is the only place
   everyday spoken Brahui lives — the corpus is folktale narration. */
function readGreetings() {
  const html = fs.readFileSync(HTML, "utf8");
  const out = [];
  const re = /\{br:'([^']+)',\s*en:'([^']+)',\s*src:'[^']*',\s*cat:'greet'\}/g;
  let m;
  while ((m = re.exec(html))) out.push({ br: m[1], en: m[2] });
  return out;
}

function main() {
  const lex = readLexdetail();
  const examples = Object.values(lex).flatMap((v) => (v && v.ex) || []);
  const paradigms = harvestParadigms(examples);
  const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
  const greetings = readGreetings();

  const course = buildUnits({ paradigms, greetings, examples, ledger });
  const json = JSON.stringify(course);
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 12);

  for (const f of fs.readdirSync(BRAHUI)) {
    if (/^course\..*\.json$/.test(f)) fs.unlinkSync(path.join(BRAHUI, f));
  }
  fs.writeFileSync(path.join(BRAHUI, `course.${hash}.json`), json);

  const html = fs.readFileSync(HTML, "utf8");
  const next = html.replace(/const COURSEREV='[^']*';/, `const COURSEREV='${hash}';`);
  if (next === html) throw new Error("COURSEREV marker not found in index.html");
  fs.writeFileSync(HTML, next);

  const items = course.units.flatMap((u) => u.lessons).flatMap((l) => l.items);
  const pending = items.filter((i) => i.review === "pending").length;
  console.log(`course.${hash}.json`);
  console.log(`  units    ${course.units.length}`);
  console.log(`  lessons  ${course.units.reduce((n, u) => n + u.lessons.length, 0)}`);
  console.log(`  items    ${items.length}  (${pending} awaiting a speaker check)`);
}

main();
```

- [ ] **Step 3: Add the npm script**

In `package.json`, add to `"scripts"` after `"audit:site"`:

```json
"build:course": "node scripts/build-course.mjs"
```

- [ ] **Step 4: Run the generator**

Run: `npm run build:course`
Expected: prints `course.<hash>.json` with 7 units, a non-zero lesson and item count, and a pending count. A `public/brahui/course.<hash>.json` now exists and `COURSEREV` in `index.html` is no longer empty.

- [ ] **Step 5: Verify it is deterministic**

Run: `npm run build:course` a second time and confirm the printed hash is identical.
Expected: same hash. If it differs, something in the pipeline is iterating a `Map` in a non-deterministic order — fix before continuing, because a changing hash busts the cache on every build.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-course.mjs package.json public/brahui/index.html public/brahui/course.*.json
git commit -m "Generate the Brahui course file from the corpus"
```

---

### Task 5: Course path UI

Render the unit path in the Learn tab, replacing the deck grid. Lessons are not playable yet — this task lands the path and the data load.

**Files:**
- Modify: `public/brahui/index.html` — the `renderLearn` area near line 6477 and the deck click handler near line 6506.

**Interfaces:**
- Consumes: `COURSEREV` (Task 4); `course.<hash>.json` (Task 4).
- Produces:
  - `loadCourse() → Promise<{version, units} | null>` — resolves `null` when the fetch fails.
  - `COURSE` — module-level cache, `null` until loaded.
  - `unitState(unitId) → 'locked'|'open'|'done'`

- [ ] **Step 1: Add the loader**

Insert after the `COURSEREV` line:

```javascript
let COURSE=null;
/* The course file is fetched once, on first entry to the tab. The app must stay
   usable without it: a failed fetch falls back to the frequency decks rather
   than showing an error, which is the same rule the dictionary follows. */
function loadCourse(){
  if(COURSE) return Promise.resolve(COURSE);
  if(!COURSEREV) return Promise.resolve(null);
  return fetch('course.'+COURSEREV+'.json')
    .then(r=>r.ok?r.json():null)
    .then(c=>{ COURSE=c; return c; })
    .catch(()=>null);
}
```

- [ ] **Step 2: Add progress state**

Insert after `function saveProgress()`:

```javascript
/* loadProgress() merges over blankProgress(), so an object saved before the
   course existed gains this key without a migration. */
function courseProg(){ return (PROG.course=PROG.course||{}); }
function lessonDone(unitId,lessonId){ return courseProg()[unitId]&&courseProg()[unitId][lessonId]==='done'; }
function markLessonDone(unitId,lessonId){
  const c=courseProg(); (c[unitId]=c[unitId]||{})[lessonId]='done'; saveProgress();
}
function unitDone(unit){ return unit.lessons.every(l=>lessonDone(unit.id,l.id)); }
function unitState(unitId){
  if(!COURSE) return 'locked';
  const i=COURSE.units.findIndex(u=>u.id===unitId);
  if(i<0) return 'locked';
  if(unitDone(COURSE.units[i])) return 'done';
  if(i===0) return 'open';
  return unitDone(COURSE.units[i-1])?'open':'locked';
}
```

- [ ] **Step 3: Render the path**

Replace the body of the levels/topics rendering in `renderLearn` with a path built from `COURSE.units`. Each unit is a button showing title, goal, and `n/m lessons`, disabled when `unitState(u.id)==='locked'`. Keep the existing "Review now" card above the path: it is how the Leitner scheduler stays reachable. When `loadCourse()` resolves `null`, render the existing deck grid unchanged.

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/brahui/index.html`, Learn tab.
Expected: seven units listed, Unit 0 open and the rest locked; the streak and "Review now" card still behave as before.

- [ ] **Step 5: Verify the fallback**

Temporarily set `COURSEREV=''` in the browser console and re-render.
Expected: the old Core 100/300/1000 deck grid appears; no error in the console.

- [ ] **Step 6: Commit**

```bash
git add public/brahui/index.html
git commit -m "Show the Brahui course path in the Learn tab"
```

---

### Task 6: Match, listen and paradigm lessons

The three auto-graded lesson types that reuse the existing scheduler.

**Files:**
- Modify: `public/brahui/index.html` — add alongside the existing `startStudy` machinery.

**Interfaces:**
- Consumes: `unitState`, `markLessonDone` (Task 5); `gradeCard`, `cardOf` (existing, line ~6418).
- Produces:
  - `startLesson(unit, lesson)` — runs a lesson to completion, then calls `markLessonDone`.
  - `cardIdFor(item) → string` — `item.br` for word items so existing progress carries over; `'s:'+item.id` for sentence items.

- [ ] **Step 1: Add the card id rule**

```javascript
/* Word items keep the id the decks already used, so a learner's boxes and
   streak survive the tab changing shape. Sentences are new and namespaced so
   they cannot collide with a headword. */
function cardIdFor(item){
  return (item.br && item.br.indexOf(' ')<0) ? item.br : 's:'+item.id;
}
```

- [ ] **Step 2: Implement the three renderers**

`match` shows the Brahui and four English options. `listen` plays the item's audio (or speaks it) and shows four English options. `paradigm` shows the stem and the tag with the form blanked and four candidate forms. All three call `gradeCard(cardIdFor(item), correct?2:0)` and advance.

- [ ] **Step 3: Gate completion on grade ≥ 2**

A lesson calls `markLessonDone` only when every item has reached `box>0` with at least one grade of 2 or better in this session. Track per-session correctness in a local `Set`; do not add new persisted state.

- [ ] **Step 4: Verify in the browser**

Open Unit 0, finish both lessons.
Expected: the unit shows done, Unit 1 unlocks, and the streak increments once for the day.

- [ ] **Step 5: Verify progress survives reload**

Reload the page.
Expected: Unit 0 still done, Unit 1 still open.

- [ ] **Step 6: Commit**

```bash
git add public/brahui/index.html
git commit -m "Add match, listen and paradigm lessons"
```

---

### Task 7: Record-and-compare speaking

**Files:**
- Modify: `public/brahui/index.html`

**Interfaces:**
- Consumes: `startLesson` (Task 6).
- Produces: `speakExercise(item, onDone)` — renders model playback, record, compare, continue.

- [ ] **Step 1: Implement the exercise**

Play the model clip. A record button starts `MediaRecorder` on `getUserMedia({audio:true})`; stopping it builds an object URL the learner can replay beside the model. The exercise is ungraded and always offers Continue.

```javascript
/* Ungraded by necessity: no Brahui speech recogniser exists, so nothing here
   can judge a learner's pronunciation, and pretending otherwise would be a lie
   told to someone trying to learn. The learner compares and decides.

   The recording never leaves the page — object URL only, revoked on exit, never
   uploaded and never written to storage. */
```

- [ ] **Step 2: Handle refusal and absence**

If `navigator.mediaDevices?.getUserMedia` is missing, or the permission is denied, hide the record button and show the model with a "say it aloud" prompt. The lesson must never block.

- [ ] **Step 3: Revoke the object URL**

Call `URL.revokeObjectURL` when the exercise unmounts or the next item loads.

- [ ] **Step 4: Verify with permission granted**

Open Unit 0's speak lesson, record, play both back.
Expected: both play; Continue advances.

- [ ] **Step 5: Verify with permission denied**

Deny the microphone in the browser's site settings and reopen.
Expected: model plays, no record button, lesson completes normally, no console error.

- [ ] **Step 6: Commit**

```bash
git add public/brahui/index.html
git commit -m "Add record-and-compare speaking practice"
```

---

### Task 8: The review screen

Without this the pending queue can never drain and the course stays mostly empty.

**Files:**
- Modify: `public/brahui/index.html`

**Interfaces:**
- Consumes: `COURSE` (Task 5).
- Produces: a review view listing pending items with accept / edit / reject, and an export producing a `course-review.json` the generator can read.

- [ ] **Step 1: List pending items**

Show each pending item's Brahui, English, gloss and `ref`, grouped by unit.

- [ ] **Step 2: Record decisions locally**

Store decisions in `localStorage` under `brahui:course-review:v1`. Accept and reject both record; edit stores the corrected Brahui or English.

- [ ] **Step 3: Export the ledger**

A button downloads a `course-review.json` whose `approved` map is keyed by the same fingerprint `scripts/course/review.mjs` computes — sha256 of `br + " " + en.toLowerCase()`, first 16 hex — so the generator picks the approvals up on its next run.

- [ ] **Step 4: Verify the round trip**

Approve two items, export, replace `public/brahui/course-review.json` with the download, run `npm run build:course`.
Expected: the pending count drops by exactly two, and those items now render in their lesson.

- [ ] **Step 5: Commit**

```bash
git add public/brahui/index.html
git commit -m "Add the course sentence review screen"
```

---

### Task 9: Offline caching

**Files:**
- Modify: `public/brahui/sw.js`

- [ ] **Step 1: Cache the course file**

Add `course.<hash>.json` to the same cache strategy `lexdetail` uses. The hash in the filename means a rebuild invalidates cleanly, so it can be cached indefinitely.

- [ ] **Step 2: Verify offline**

Load the course online, then go offline in DevTools and reload.
Expected: the path and a completed lesson still render.

- [ ] **Step 3: Commit**

```bash
git add public/brahui/sw.js
git commit -m "Cache the course file for offline use"
```

---

## Self-review

**Spec coverage.** Unit map → Task 3. Lesson types → Tasks 6 and 7. Content pipeline → Tasks 1, 3, 4. Item schema → Task 3. Review gate → Tasks 2 and 8. Audio preference → Task 6 (`listen` prefers a clip, falls back to speech). SRS underneath → Tasks 5 and 6. Offline → Task 9. Phasing → the `UNITS` constant in Task 3 holds only `u0`–`u6`.

**Known gap, deliberate.** The spec says `build-audio.js` should render clips for approved generated sentences. That is not a task here: it depends on a batch of approvals existing, which cannot happen until Task 8 ships and a speaker uses it. It is the first task of the next plan.

**Type consistency.** `harvestParadigms` returns `Map<string, Map<string,string>>` in Task 1 and is consumed as such in Tasks 3 and 4. `applyReviews(items, ledger)` has the same signature in Tasks 2 and 3. `itemFingerprint` is defined in Task 2 and its exact algorithm is restated in Task 8 Step 3, where the browser must reimplement it. `cardIdFor` is defined once in Task 6.
