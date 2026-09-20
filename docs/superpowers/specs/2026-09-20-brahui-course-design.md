# Brahui guided course — design

Date: 2026-09-20
Status: approved in outline, not implemented

Replace the Brahui app's Learn tab with a linear, Duolingo-style course that
teaches spoken Brahui: everyday words first, then the person system one form at
a time, then word formation. The existing spaced-repetition scheduler stays and
becomes the review engine underneath the path.

## Why this shape

The app already knows a great deal, and the design is built on what is actually
in the data rather than on what a language course usually assumes.

**The corpus is narration, not conversation.** `lexdetail.c6ebf98142d2.json`
holds 5,205 examples from Ali & Kobayashi's *Brahui Texts*, 98% of them
morphologically glossed. The distribution is a folktale distribution:

| Person | Examples | | Tense/mood | Examples |
|---|---|---|---|---|
| 3SG | 6,336 | | PST | 4,555 |
| 3PL | 1,657 | | PRS | 2,009 |
| 1SG | 1,634 | | COP | 1,628 |
| 2SG | 991 | | IMP | 510 |
| 1PL | 350 | | SBJV | 496 |
| 2PL | 111 | | FUT | 168 |

Everyday speech lives in the bottom-left of that table — first and second
person, present tense. The corpus is strongest exactly where a speaking course
needs it least. This is the central constraint of the project, and every
decision below follows from it.

**But the grammar is recoverable.** Aligning surface tokens to gloss tokens
yields 60 verb stems with four or more distinct inflected forms, and the richest
are the ones any course is built on:

| Stem | Forms | Examples |
|---|---|---|
| do | 46 | `kar-oŧ` FUT.1SG, `kar-os` FUT.2SG, `kar-ak` IMP |
| become | 37 | `mar-oŧ`, `mar-ore` FUT.2PL, `mass-uŧa` IPF.1SG |
| see | 34 | `xan-oŧ`, `hur-ak` IMP, `xan-áka` IPF.3SG |
| go | 32 | `hin-oŧ`, `hin-ása` IPF.2SG, `xarr-a` IMP |
| come | 32 | `bar-os`, `ba-faroŧ` NEG.FUT.1SG |

Suppletion (*go*: `hin-` / `xarr-` / `him-`) and negation come through as
first-class forms. So the paradigms are real data, not invention.

The conclusion: **generate sentences from attested paradigms, and have a
speaker review them before any learner sees them.** The app already has the
surface for this — it reports "207 awaiting a speaker check".

## Scope

In scope: the course path, its lesson types, the generator that produces its
content, and the review gate that admits content to it.

Out of scope: speech recognition (no Brahui ASR exists), the Dictionary,
Phrases, Sounds and Tools tabs, and any change to the Android shell. The app is
a Bubblewrap TWA over `https://www.webutilia.com/brahui/index.html`, so shipping
the course is a web deploy; no store release is involved.

## Unit map

Twelve units. Unit 0 exists to buy the grammar spine its first ten minutes — a
course that opens on the copula loses people before it teaches them anything.

| # | Title | Teaches | Data source |
|---|---|---|---|
| 0 | Say hello | Greetings, yes/no, thanks, names. No grammar explained. | `cat:'greet'` seed words + phrase list |
| 1 | This is… | Copula present, demonstratives (`dá`) | COP.PRS.* |
| 2 | I | 1SG present/imperfective | IPF.1SG, PRS.1SG |
| 3 | You | 2SG + yes/no questions | IPF.2SG, PRS.2SG |
| 4 | He, she, it | 3SG | IPF.3SG, COP.PRS.3SG |
| 5 | They | 3PL | IPF.3PL, PST.3PL |
| 6 | We, you all | 1PL, 2PL | IPF.1PL, FUT.2PL |
| 7 | Yesterday | Past | PST.* |
| 8 | Do it | Imperative | IMP, IMP.PL |
| 9 | Not | Negation | NEG.* |
| 10 | Tomorrow | Future | FUT.* |
| 11 | Building words | Case and derivation: GEN, D/A, ALL, ABL, LOC | case-tagged tokens |

Ordering notes:

- **3PL before 1PL/2PL.** Unit 5 comes before Unit 6 because 3PL has 1,657
  attested examples and 2PL has 111. The thinnest units are sequenced late, so
  they depend most on generated sentences — and arrive after the reviewer has
  seen the generator's output on easy forms and can judge it faster.
- **Word formation last**, as requested. It only makes sense once the learner
  recognises the pieces being combined.

**Phasing.** Units 0–6 are v1: they cover the whole person system, which is the
spine. Units 7–11 are v2. The generator and the schema handle all twelve from
the start; only the emitted content is phased.

## Lesson types

Five, each doing one job.

| Type | Shape | Graded |
|---|---|---|
| `match` | Word ↔ meaning tiles | yes |
| `build` | Tap word tiles into a sentence | yes |
| `listen` | Hear audio, choose the meaning | yes |
| `paradigm` | Fill the missing person slot in a conjugation table | yes |
| `speak` | Hear the model, record yourself, compare | no |

`build` is the workhorse — it is how Duolingo actually teaches grammar, it is
auto-gradable, and it forces word order and person agreement.

`speak` is ungraded by necessity: there is no Brahui ASR, so nothing can judge
the learner's pronunciation. It plays the model, records via `MediaRecorder`,
and plays both back for comparison. The recording is held in memory and
discarded on lesson exit — it is never uploaded and never written to storage.
If `MediaRecorder` or microphone permission is unavailable, the exercise
degrades to listen-and-repeat rather than blocking the lesson.

## Content pipeline

`scripts/build-course.mjs`, run by `npm run build:course`. Follows the existing
convention of `build-audio.js` and `sync-brahui.mjs`: a Node script that reads
data, writes a hashed asset into `public/brahui/`, and rewrites a marked line in
`index.html`.

```
lexdetail.<hash>.json ──┐
seed word lists      ───┼──► build-course.mjs ──► public/brahui/course.<hash>.json
paradigm extraction  ───┘                     └─► COURSEREV line in index.html
```

Steps:

1. Align surface and gloss tokens per example; discard examples whose token
   counts disagree (this is what the 60-stem extraction already does).
2. Harvest `stem → {tag: surface form}` paradigm tables.
3. For each unit, select the target forms and build items: attested sentences
   where they exist, generated substitutions where they do not.
4. Mark every item `review: "pending"` unless it is verbatim attested corpus
   text, which is marked `"ok"` — a sentence the corpus contains needs no
   speaker check.
5. Emit the JSON; never promote an item's review status.

### Item schema

```json
{
  "id": "u2l1i3",
  "br": "mass-uŧa",
  "ur": "مَسُّٹہ",
  "en": "I become",
  "gloss": "become-IPF.1SG",
  "tiles": ["mass-uŧa"],
  "audio": "a1b2c3d4",
  "src": "corp",
  "ref": "2.20 §232",
  "review": "ok"
}
```

The form above is attested, so it carries `src: "corp"` and needs no speaker
check. A generated item differs only in `src: "gen"` and `review: "pending"`.

`src` is `corp` (verbatim attested) or `gen` (generated). `ref` carries the
corpus citation so a reviewer can check the source. `audio` is an AUDIOKEYS key
or absent.

### The review gate

A lesson renders only items with `review: "ok"`. Pending items are invisible to
learners and appear in a review screen that extends the existing speaker-check
surface: the item, its gloss, its source citation, and accept / edit / reject.
Accepting writes the approval back to a reviewed-items file that the generator
reads on its next run, so approvals survive regeneration.

This is the load-bearing rule of the whole design: **generated Brahui never
reaches a learner unreviewed.** A language course that teaches wrong forms is
worse than no course.

## Audio

Unit 0 and attested corpus sentences can use pre-rendered clips from
`public/brahui/audio/` (6,646 files, keyed in `AUDIOKEYS`). Generated sentences
have no clips and fall back to browser TTS.

That fallback is currently unreliable: the Urdu voice expands `ڈا` to ڈاکٹر and
says "doctor" for the demonstrative `dá`, which `URDU_SPEECH_RESPELL` now works
around. Because of this, `listen` and `speak` exercises **prefer items with a
pre-rendered clip** and fall back to TTS only when none exists. Once a batch of
generated sentences is speaker-approved, `build-audio.js` should render clips
for them, after which they behave like any other item.

## SRS underneath

`gradeCard(id, g)` and the Leitner boxes stay exactly as they are:

```js
const PKEY='brahui:progress:v1';
const BOXDAYS=[0,1,3,7,16,40];
const LEARNED_BOX=3;
PROG.cards[id] = {box, due, seen, ok}
```

- **Word items reuse their existing card ids**, so saved progress and streaks
  carry over. Nobody loses their history when the Learn tab changes shape.
- **Sentence items get new ids** namespaced `s:` so they cannot collide with
  word cards.
- Lesson answers call `gradeCard` exactly as the current decks do. Due cards
  surface as a "Review" lesson at the top of the path, which is how the
  scheduler keeps working without the learner meeting it directly.

Progress gains one key: `PROG.course = { "u2": { "u2l1": "done" } }`. A lesson
is done when every item in it has been graded at "good" or better at least once
— `gradeCard`'s scale is 0 again, 1 hard, 2 good, 3 easy, so the threshold is
`g >= 2`. A unit unlocks when the previous unit is done. Ungraded `speak`
exercises do not count toward completion. `loadProgress()` already merges unknown keys
over `blankProgress()`, so an old saved object upgrades without migration.

## Offline

`course.<hash>.json` is fetched on first entry to the course and cached by
`sw.js` alongside `lexdetail`. The hash in the filename means a new build
invalidates cleanly. The app must stay usable with the course JSON absent —
if the fetch fails, the tab shows the dictionary-backed decks rather than an
error.

## Risks

- **Generated Brahui may be unidiomatic.** Substituting nouns into attested
  frames produces grammatical sentences that a speaker may still find odd. The
  review gate is the mitigation, and it only works if review actually happens.
- **Units 5 and 6 are thin.** 1PL has 350 attested examples and 2PL has 111, so
  those units lean hardest on generation. Sequencing them late is the
  mitigation, not a cure.
- **Review is a human bottleneck.** The course cannot outrun the reviewer. Unit
  0–2 should be reviewed and shipped before later units are generated, so the
  queue never grows faster than it drains.
- **`index.html` is already 1.17 MB.** The course engine adds to a file that is
  large and self-contained by design. Content goes in the separate JSON, not the
  HTML; only the engine is inlined.

## Success criteria

1. A learner who has never opened the app can finish Unit 0 and say four things
   aloud, with model audio for each.
2. By the end of Unit 4 they can produce present-tense sentences in the first,
   second and third person singular, and the `paradigm` exercise proves it.
3. No sentence appears in a lesson without either corpus attestation or a
   recorded speaker approval.
4. Existing learners keep their streak and their card boxes.
