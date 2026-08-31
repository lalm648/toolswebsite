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
3. Rebuild the Brahui dictionary as a dictionary-and-translator section with indexable
   per-entry pages.
4. Generate internal linking from the registry rather than by hand.
5. Apply the Semrush on-page fixes to the 21 covered URLs.

## 4. Non-goals

- Tool computation logic, routing, and the data layer are untouched. Where a tool gains
  a new result visual, that visual reads existing state; it does not change how the tool
  computes.
- Backlink acquisition.
- Italian-language content for `hash-calculator`, despite its Italian query.
- Authoring Brahui-language lexical content. Structure is in scope; verified Brahui
  content is not, and will not be invented.

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
| `--brand-ink` | `#067A52` | brand as text on light (5.4:1) |
| `--lime-ink` | `#3F6B00` | secondary brand text on light (6.3:1) |
| `--ink` | `#08120C` | text on neon fills (16.4:1) |

**Contrast rule.** Mint and greenyellow are surfaces — button fills, gradient washes,
meter bars, icon tiles, highlight marks — always with `--ink` on top. White text on
greenyellow measures 1.18:1 and is forbidden. Where brand colour must be text on a light
background it steps down to `--brand-ink`. On dark canvas the neon may be text freely
(11.9:1). This rule is why the current tokens darkened the brand to `#047857` and
confined lime to "small accents"; the constraint is real, the response was to hide the
brand rather than place it correctly.

Additional new tokens: `--brand-gradient`, `--brand-bloom`, `--surface-inverse`.
`--action-fg` changes from `#ffffff` to `--ink`, which visibly changes every primary
button on all 78 pages. The six `--surface-*` tokens that are all currently `#ffffff`
gain real tonal steps so nested cards stop reading as one plane.

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
| `BeforeAfter` | Drag slider plus numeric delta, fed by real tool output. |
| `ResultMeter` | Gradient bar for size, quality, or savings. |
| `CategoryTile` | Compact tile replacing the paragraph card. |
| `DeviceFrame` | Browser chrome around live tool previews. |

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

Promoted from one tool to a section, because it is the only page with demonstrated
ranking ability and the weakest competitive field.

- **Dictionary and translator UI** — direction switcher across Brahui, English, and
  Urdu; correct `lang` and `dir` attributes per script; audio playback from the existing
  `public/brahui` assets; example sentences; related words.
- **Per-entry pages** — one indexable URL per word. A single search box ranks for
  nothing; per-entry pages are what capture "meaning in Urdu" style queries and are the
  only way one dataset becomes many URLs.
- **Content hub** — script, grammar, numbers, phrases, learner guides.

Structure and URL architecture are in scope. The lexical content and its keyword
targeting are not: the Semrush file contains zero Brahui rows, and Brahui content will
not be fabricated. Entry pages ship with content slots fed by the existing dataset,
and gaps are left visible rather than filled with invented translations.

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
| 5 | Brahui section and per-entry pages (family F8) | Highest-value SEO work |
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
| Brahui invested in without volume data | Stated openly; rests on winnability and 12 observed clicks |
| 57 tools have no keyword data | They receive design-only treatment this round |
| Redesign is expected to fix rankings | Stated openly: position 81 is an authority problem |

## 10. Open items

1. Semrush exports for the 57 uncovered tools, or accept design-only treatment.
2. Brahui keyword data — Semrush export, Search Console query data, or a term list.
3. Owner image links for `HeroVisual` slots, whenever available.

## 11. Phase-0 baseline

Captured August 31, 2026 from a clean `npm run build` (exit code 0).

| Metric | Baseline |
| --- | --- |
| Static JS | 102 files, 3.39 MB uncompressed |
| Static CSS | 2 files, 108.7 KB uncompressed |
| Routes prerendered | 78 |
| `npm run build` | exit 0 |
| Web font requests | 0 external (`next/font` self-hosts both families) |

Each phase re-measures these. Growth in CSS is expected and acceptable. New components
do add JS, so the budget is **+5% total static JS across all phases** (3.39 MB to no more
than 3.56 MB); no new runtime dependency may be added at all. Exceeding the JS budget
blocks the phase.
