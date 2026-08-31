# Webutilia Editorial Redesign — Design

Date: August 31, 2026
Status: Approved for planning
Supersedes the visual direction in `DESIGN.md` (dark-first, emerald, lime-as-accent).

## 1. Problem

The site is competently built but reads as generic and text-only. Every surface is
typography: category cards are an icon, a heading, and a two-line paragraph; tool cards
use the same recipe; no page carries imagery, product preview, or visual proof. Three
categories fill the viewport where competitors show twenty tools. There is a thorough
design system in `DESIGN.md`, but it is executed as type alone, with no visual layer.

## 2. Evidence

Two owner-supplied exports, both dated August 31, 2026.

### Google Search Console — last 3 months

3,242 impressions, 8 clicks across 875 queries.

| Page | Impressions | Position | Clicks |
| --- | ---: | ---: | ---: |
| `/tools/document/epub-to-pdf` | 1,559 | 81.3 | 1 |
| `/tools/image/bulk-image-resizer` | 862 | 81.1 | 0 |
| `/tools/seo/meta-tag-generator` | 702 | 63.8 | 1 |
| `/tools/developer/regex-tester` | 323 | 67.9 | 0 |
| `/tools/developer/sql-schema-visualizer` | 314 | 68.8 | 2 |
| `/tools/dictionary/brahui-dictionary` | 129 | **9.7** | **12** |
| `/` | 123 | 2.5 | 7 |

Almost every tool page sits at position 55–90 — page 6 to 9 of results. The Brahui
dictionary is the sole exception at position 9.7, and it earns more clicks than every
other tool page combined.

### Semrush On-Page SEO Checker — 542 ideas, 21 URLs

| Idea type | Count | Fixable on-site |
| --- | ---: | --- |
| Backlinks | 94 | No |
| H1 / title missing keyword | 166 | Yes |
| Schema markup | 83 | Yes |
| Content length | 65 | Yes |
| Readability | 47 | Yes |
| Semantic gap (exact terms supplied) | 35 | Yes |
| Meta description | 25 | Yes |

Coverage is 21 of 78 pages; 57 tools have no keyword data. `epub-to-pdf` alone accounts
for 282 ideas and 51 keywords, nearly all misspelling variants of one query — a single
page opportunity, not 51 pages.

### Competitive scan

`epub to pdf` is contested by iLovePDF, Zamzar, CloudConvert, and Adobe. `brahui
dictionary` is contested by two Blogspot blogs (one last updated 2013), iJunoon, and
generic aggregators that hold no real Brahui corpus.

### Conclusion drawn from the evidence

Ranking at position 81 is an authority problem, not a design problem; no redesign moves
a page from 81 to 10, which is consistent with backlinks being the largest Semrush
bucket. The redesign is justified on conversion, credibility, and CTR — not on position.
The one place the site demonstrably ranks is its weakest-competition niche.

**No search volume figures were available.** Semrush MCP had no API units. The Brahui
case rests on winnability and on 12 observed clicks, not on measured demand. The
`brahui dictionary` query itself showed only 4 impressions.

## 3. Goals

1. Replace the text-only presentation with a bold editorial visual system.
2. Give every tool a design appropriate to its interaction shape, plus its own result UI.
3. Rebuild the Brahui dictionary as a dictionary-and-translator section, extracting the
   3,473 existing entries out of the iframe into indexable per-entry pages.
4. Generate internal linking from the registry rather than by hand.
5. Apply the Semrush on-page fixes to the 21 covered URLs.

## 4. Non-goals

- Tool computation logic, routing, and the data layer are untouched. Where a tool gains
  a new result visual, that visual reads existing state; it does not change how the tool
  computes.
- Backlink acquisition.
- Italian-language content for `hash-calculator`, despite its Italian query.
- Authoring new Brahui lexical content. None is required: 3,473 CC BY 4.0 entries with
  audio already ship in `public/brahui/`. The work is extraction and presentation, and no
  Brahui content will be invented to fill gaps.

## 5. Hard constraint: site health

Current health is 98+ and must not regress. This constrains the editorial direction,
which would otherwise reach for large imagery.

- **No new web fonts.** `Plus Jakarta Sans` and `JetBrains Mono` are already self-hosted
  through `next/font/google`. No external font requests may be added.
- **No raster hero imagery by default.** Hero visuals are CSS gradients and inline SVG.
- **No `filter: blur()` on large elements.** Blooms use a plain `radial-gradient`, which
  rasterizes cheaply, not a blurred layer. (The direction proof used `filter: blur()`;
  that must not ship.)
- **No new runtime dependencies.** `motion` is already present and is the only
  animation system.
- **CLS**: every visual slot has reserved aspect-ratio space before paint.
- **LCP** stays a text node (the hero headline), never an image.
- Owner-supplied images, when they arrive, go through `next/image` with explicit
  dimensions.

Baseline is captured by `npm run build` before phase 1 and compared after each phase.

## 5a. Hard constraint: the Brahui audio and sheet engine

Owner-directed and non-negotiable. `public/brahui/index.html` and
`public/brahui/lexdetail.c6ebf98142d2.json` are **frozen**. No phase edits them.

What that protects, verified by inspection of the document:

| Machinery | Evidence in the file |
| --- | --- |
| Text-to-speech and voice ranking | 9 `speechSynthesis` references, 1 `getVoices`, 1 `AudioContext` |
| Recorded-speaker pronunciation playback | 2 `new Audio`, `.m4a` sources over 6,646 files |
| Modal / sheet switching | 32 `sheet` references |
| Saved words, progress, theme persistence | 9 `localStorage` references |

There is no `getUserMedia` or `MediaRecorder`, so "speaking records" means playback of
real speaker recordings, not user capture.

Consequences for the work:

- The iframe is retained, exactly as section 6.5 states. Retiring it is off the table.
- Extracted entry pages **read** the same `.m4a` assets through a plain `<audio>`
  element. They do not reimplement voice ranking, TTS, or the sheet system, and they do
  not import the framed app's script.
- Theme remapping onto Webutilia tokens has already been applied inside that document.
  Any further visual alignment happens on the surrounding shell, never in the file.
- If a change ever appears to require editing the frozen file, that is a signal to stop
  and raise it, not to proceed.

## 6. Design

### 6.1 Token layer

`src/app/globals.css` already separates `:root` (light) from `[data-theme="dark"]`. That
structure is kept; values change.

Brand ramp sampled from `public/webutilia-logo.png`:

| Token | Value | Role |
| --- | --- | --- |
| `--brand-mint` | `#00E7A0` | gradient start |
| `--brand-spring` | `#47F170` | gradient mid |
| `--brand-chartreuse` | `#BEF817` | gradient mid |
| `--brand-lime` | `#D3FA05` | gradient end |
| `--brand-ink` | `#067A52` | brand as text on light (5.37:1) |
| `--lime-ink` | `#3F6B00` | secondary brand text on light (6.34:1) |
| `--ink` | `#08120C` | text on neon fills (15.83:1) |

**Contrast rule.** Mint and greenyellow are surfaces — button fills, gradient washes,
meter bars, icon tiles, highlight marks — always with `--ink` on top. White text on
greenyellow measures 1.20:1 and is forbidden. Where brand colour must be text on a light
background it steps down to `--brand-ink`. On dark canvas the neon may be text freely
(11.74:1). This rule is why the current tokens darkened the brand to `#047857` and
confined lime to "small accents"; the constraint is real, the response was to hide the
brand rather than place it correctly.

Additional new tokens: `--brand-gradient`, `--brand-bloom`, `--surface-inverse`.
`--action-fg` changes from `#ffffff` to `--ink`, which visibly changes every primary
button across the site.

**Outstanding, deferred to phase 3.** `--surface`, `--surface-strong`, `--surface-raised`,
`--surface-card`, and `--surface-hero` are all still `#ffffff`, so nested cards continue to
read as one flat plane. Giving them real tonal steps belongs in this section and was
promised here, but the phase 1-2 implementation plan never scoped a task for it, so nothing
delivered it. It is deferred rather than done: changing five surface values alters every
card on all 91 routes, and this repository has no visual regression test, so it is safer
paired with the shared-shell rebuild in phase 3 where those cards are being reworked
anyway.

**Theme default.** `src/app/layout.tsx:117` currently falls back to
`prefers-color-scheme`. It becomes a literal `"light"`. The toggle and its persistence
are unchanged, so a visitor's explicit choice still wins. Accepted tradeoff: a visitor
whose OS is set to dark now gets light on first paint.

### 6.2 Visual primitives

New, in `src/components/visual/`:

| Primitive | Purpose |
| --- | --- |
| `BrandBloom` | Radial gradient wash behind heroes. No blur filter. |
| `HeroVisual` | Slot-based: renders an owner-supplied image when given one, self-generated SVG otherwise. |
| `BeforeAfter` | Paired before/after cards with a proportional meter, fed by real tool output. |
| `ResultMeter` | Gradient bar for size, quality, or savings. |
| `CategoryTile` | Compact tile replacing the paragraph card. |
| `DeviceFrame` | Browser chrome around live tool previews. |

**What `BeforeAfter` actually is.** An earlier draft of this section described it as a
"drag slider plus numeric delta". The shipped component is not a slider: it renders two
labelled cards holding pre-formatted display strings, plus an optional `ResultMeter`
showing the after value as a proportion of the before value, plus a `children` slot for an
eventual visual comparison. Nothing drags. The description is corrected here rather than
left claiming a capability that does not exist; a real drag comparison can be built into
the `children` slot when a tool needs one.

`HeroVisual` is the forward-compatibility seam: owner image links drop into named slots
without layout change.

### 6.3 Tool family shells

Tools are grouped by input/output shape rather than by category, because a JPG→PNG
converter and an EPUB→PDF converter are the same interaction while an image compressor
and a video compressor are the same interaction. Category continues to drive colour;
family drives layout. This extends the existing Input → Refine → Review → Finish model
in `docs/webutilia-2.0-intent-map.md` rather than replacing it.

| Family | Shape | Approx. tools |
| --- | --- | ---: |
| F1 Converter | drop, choose target, convert, download | 22 |
| F2 Transformer | drop, live preview, parameter controls, before/after | 14 |
| F3 Batch | queue list, per-item status, ZIP export | 5 |
| F4 Text pipe | dual pane in/out, live, copy | 9 |
| F5 Analyzer | input, structured result panel | 6 |
| F6 Generator | small form, rendered artifact | 8 |
| F7 Lookup | query, record tables via the existing API route | 7 |
| F8 Dictionary | search-first plus entry pages | 1 |

Each family is one shell component. Each tool supplies only its own controls and result
renderer. Eight shells plus 68 small control sets is maintainable where 68 bespoke
designs is not.

Family assignment is added to the registry in `src/lib/data/tools.ts` and enforced by
`scripts/audit-tool-registry.mjs`, which already fails when a tool lacks a workflow
definition.

### 6.4 Page architecture

- **Home** — hero becomes a working drop zone with a real before/after result. Search
  demotes to the header. Category paragraph cards become the dense tile grid.
- **Category** — `CategoryPage.tsx` is one shell; all 10 categories inherit.
- **Tool** — `ToolShell.tsx` and `WorkbenchFrame.tsx` gain the family layer. The tool
  stays above supporting SEO content, as `DESIGN.md` already requires.

### 6.5 Brahui section

Promoted from one tool to a section. It is the only page with demonstrated ranking
ability, it faces the weakest competitive field, and it already owns the content.

**Current implementation.** `src/components/tool/BrahuiDictionaryTool.tsx` is 82 lines
that render an `<iframe>` onto `public/brahui/index.html` — a self-contained 1.08 MB
document with its own engine, plus `lexdetail.c6ebf98142d2.json` (1.31 MB of senses and
glossed examples) and 6,646 audio files totalling 113 MB. Entries are fully structured
in the pre-rendered markup:

    <article class="lexrow" id="w-abad" data-b="ábád"
      data-e="populated; cultivated; prosperous" data-p="a." data-c="qual"
      data-f="10" data-t="Farsi">
      <span class="lex-ur ur" dir="rtl">آبَاد</span>…

That yields headword, Arabic-script form, English gloss, part of speech, category
(10 of them), corpus frequency, and etymology — 3,473 rows — with interlinear example
sentences and citations in the JSON. Source: Ali & Kobayashi (2024), *Brahui Texts*,
ILCAA Asian and African Lexicon 66, CC BY 4.0.

**The defect.** Iframe content is not attributed to the parent document, so
`/tools/dictionary/brahui-dictionary` ranks at position 9.7 on a loading message and an
attribution line. All 3,473 words share one URL, and `public/brahui/index.html` is absent
from `src/app/sitemap.ts`, which emits only the 78 registry routes — so the document that
holds the content is not submitted for indexing either. 6,646 pronunciations are
invisible to search.

**The work.**

- **Extract to routes.** Build `/tools/dictionary/brahui/<slug>` from the existing markup
  and JSON at build time: roughly 3,473 statically generated pages, each carrying script
  form, gloss, POS, frequency, etymology, example sentences with citations, and audio.
  This is an extraction, not an authoring task.
- **Index pages** per category and per letter, so entry pages are reachable by crawl.
- **Sitemap** gains every entry route.
- **Dictionary and translator UI** — direction switcher across Brahui, English, and
  Urdu; correct `lang` and `dir` per script; audio playback; example sentences; related
  words by category and frequency.
- **Shell.** The app is currently wrapped in the generic Input → Process → Output rail
  at a fixed height, producing a scroll container inside a scrolling page. The rail is
  meaningless here because nothing is processed. F8 replaces it.
- **Retain the iframe.** Settled, not optional — see section 5a. The framed app keeps
  the spaced-repetition scheduler, transliterator, speech ranking, and sheet system that
  its own test suites cover. It is the interactive surface; the extracted routes are what
  search sees. Both read the same data, so they cannot diverge.

Lexical content is not authored or invented — every field on an entry page traces to the
CC BY 4.0 source, and attribution is carried on each page. Entries flagged in the data as
awaiting a speaker check are marked as such rather than presented as settled.

**Payload note.** The 113 MB audio directory is per-file lazy loaded and does not enter
any page bundle; the 1.08 MB framed document loads only on the dictionary route. Neither
counts against the section 5 budget, but extracted entry pages must not inline the JSON.

### 6.6 Internal linking

Generated from the registry so it cannot rot: by **conversion graph** (`png-to-webp`
links to `webp-to-png`, `png-to-jpg`, and the image compressor), by **family**, and by
**category**. Replaces the hand-written lists in `RelatedTools.tsx`.

### 6.7 SEO application

Semrush ideas map onto the phases: H1, title, and meta fixes ride with the shells;
semantic-gap terms and content length go into the per-tool content pass; schema markup
is added once to the tool template and covers all 78 pages.

## 7. Phasing

| # | Phase | Effect |
| --- | --- | --- |
| 1 | Tokens, contrast rule, light-first flip | Whole site shifts immediately |
| 2 | Visual primitives | No user-visible change alone |
| 3 | Shared shells: Header, Footer, `ToolShell`, `CategoryPage`, `ToolCard` | All 78 pages inherit |
| 4 | Home, full editorial treatment | Landing page complete |
| 5 | Brahui section: extract 3,473 entry routes, F8 shell | Highest-value SEO work |
| 6 | The other seven family shells (F1-F7) | All tools gain appropriate layout |
| 7 | Per-tool result UI, batched by category | The long tail |
| 8 | Semrush on-page fixes for the 21 covered URLs | Applied to top pages first |

Phases 1–4 already produce a site that looks entirely different.

F8 is built in phase 5, ahead of the other family shells, because the Brahui section is
bespoke enough that it does not wait on the shared family layer. Each phase gets its own
implementation plan; the first plan covers phases 1–4 only.

Ordering note: the owner initially confirmed `epub-to-pdf` as priority one. The Search
Console export arrived afterwards and showed that page at position 81 against
iLovePDF-class competition while Brahui sat at 9.7. The owner then delegated the
ordering decision, and Brahui was placed first on that evidence. `epub-to-pdf` remains
in phase 8, where its 282 on-page ideas are applied; the expectation is movement from
81 toward 40, not onto page one, until backlinks exist.

## 8. Verification

Run after every phase:

- `npm run build` — compare bundle sizes against the phase-0 baseline
- `npm run lint`
- `node --test tests/*.test.mjs`
- `npm run audit:tools` and `npm run audit:outputs`
- Screenshots of every changed page in both light and dark themes

A phase is not complete until the build is green and bundle size has not grown
materially. Health-score regression blocks the phase.

## 9. Risks

| Risk | Response |
| --- | --- |
| Editorial visuals regress the 98+ score | Section 5 budget; measured every phase |
| `--action-fg` flip changes every button at once | Intended; verified by screenshot across both themes |
| Light-first overrides OS dark preference | Accepted and owner-directed; toggle still persists choice |
| A design or SEO change reaches into the frozen Brahui file | Section 5a forbids it; the shell absorbs visual change instead |
| Brahui invested in without volume data | Stated openly; rests on winnability and 12 observed clicks |
| ~3,473 new static routes slow the build | Measured at phase 5; entry pages are data-only and must not inline the 1.31 MB JSON |
| 57 tools have no keyword data | They receive design-only treatment this round |
| Redesign is expected to fix rankings | Stated openly: position 81 is an authority problem |

## 10. Open items

1. Semrush exports for the 57 uncovered tools, or accept design-only treatment.
2. Brahui keyword data — Semrush export or Search Console query data. Not a blocker:
   the corpus supplies headwords, glosses, and frequency, which is enough to build and
   prioritise entry pages without it.
3. Owner image links for `HeroVisual` slots, whenever available.

## 11. Phase-0 baseline and Phase 1-2 measurement

Both columns were produced the same way on the same machine: a clean `npm run build`,
then `find .next/static` for byte totals and `.next/prerender-manifest.json` for the
route count. The baseline column is a REBUILD of commit `a3e2aaa` performed after
phase 1-2 finished, specifically so the comparison uses one method rather than two.

| Metric | Baseline (rebuilt `a3e2aaa`) | Phase 1-2 (`75476d0`) | Delta |
| --- | --- | --- | --- |
| Static JS | 102 files, 3.39 MB | 102 files, 3.39 MB | **0** |
| Static CSS | 2 files, 109.1 KB | 2 files, 109.9 KB | +0.8 KB |
| Routes prerendered | 91 | 91 | **0** |
| `npm run build` | exit 0 | exit 0 | — |
| External web font requests | 0 | 0 | **0** |

**Analysis.** Static JS did not grow at all: the six visual primitives are not yet
imported by any route, so webpack does not pull them into a chunk. They will land in
the bundle when phase 3 wires them in, and that is the measurement that matters for
the ceiling. CSS grew 0.8 KB, which is the new token declarations. No route was added.

**Correction to an earlier figure.** This section previously recorded the baseline as
"78 routes" and "108.7 KB" CSS. The 78 was wrong — it was inferred from the content-page
count (68 tools + 10 categories) rather than measured, and the real prerendered-route
count was 91 both before and after. A verification run briefly read this as a +15 route
regression; the rebuild above shows 91 on both sides, so nothing was added. The 108.7 KB
came from a build in a different checkout and is superseded by the 109.1 KB rebuild.

**Known pre-existing failure, not caused by this work.** `npm run audit:outputs` fails
in this environment because `ffmpeg` is not installed. Confirmed to fail identically on
the rebuilt `a3e2aaa` baseline, so it is environmental. `npm run lint`,
`node --test tests/*.test.mjs` (50 tests), and `npm run audit:tools` (68 tools) all pass.

Each subsequent phase re-measures these. Growth in CSS is expected and acceptable. New
components do add JS, so the budget is **+5% total static JS across all phases**
(3.39 MB to no more than 3.56 MB); no new runtime dependency may be added at all.
Exceeding the JS budget blocks the phase.
