/*
  The full Brahui word list — styled like a dictionary, but built for the page's
  performance budget rather than against it.

  Why this section exists: the interactive dictionary above is served in an iframe,
  and iframe content is not attributed to the parent document. Before this section
  the page Google indexed held none of the 3,473 words.

  Why it is shaped this way. Three shapes were built and measured on this page:

    definition-list markup, 5 el/entry   18,530 elements   LCP 7,660 ms
    bold headword only,      1 el/entry    ~3,600 elements   LCP ~1,000 ms
    plain text blocks,       0 el/entry       559 elements   LCP   792 ms

  Five elements per entry cost roughly ten times the LCP for styling that the
  interactive app above already provides far better. So each entry gets exactly
  ONE element: a <b> around the headword. That is the one cue that makes a word
  list scannable — everything else on the line is a text node, which is free. CSS
  cannot target part of a text node, so the remaining fields share one style by
  necessity, and columns plus a hanging indent carry the dictionary feel instead.

  Letter groups are collapsed in <details>. A closed <details> is still in the DOM,
  so the words stay indexable while the reader sees a compact letter index rather
  than an endless scroll.

  The script form sits inside Unicode first-strong isolates (U+2068 … U+2069)
  rather than a <span dir="rtl">: an isolate is a character, so it costs no element
  while still stopping the Arabic from reordering the Latin around it.

  A server component with no interactivity — it adds no JavaScript to the bundle.
*/

import type { BrahuiEntry, BrahuiLetterGroup } from "@/lib/data/brahui-lexicon";

const ISOLATE_START = "⁨";
const ISOLATE_END = "⁩";

/*
  The entries are handed to React as ONE pre-built HTML string per letter rather
  than as elements.

  Measured reason: rendering 3,473 headwords as JSX put every one of them into the
  React Server Component payload — a 690 KB .rsc file the browser has to parse and
  reconcile — which took Total Blocking Time from 440 ms (the framed app alone) to
  860 ms and halved the page's performance score. A single string is one node in
  that payload regardless of how much markup it contains, while the rendered HTML,
  and therefore what a crawler reads, is identical.

  The source is a build-time file we control, never user input, but every field is
  still escaped: a stray `&` or `<` in a gloss would otherwise corrupt the markup.
*/
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/*
  The headword carries `lang="brh"`, and nothing else does.

  It used to sit on the wrapping <p>, which also holds the ENGLISH gloss of every
  entry — so 94% of this page's text was declared to be Brahui on a page that
  exists to rank for English queries. The headword and its script form are the
  only Brahui on the line; the gloss inherits `en` from <html> as it should.

  The <b> carries no class. Repeating `class="font-bold text-[var(--ink-900)]"`
  3,473 times cost 40 bytes an entry in the rendered markup AND another 40 in the
  RSC payload that mirrors it — 278 KB of the 803 KB page to say one thing 3,473
  times. The parent styles its own <b> children instead, in one selector.
*/
function entryMarkup(entry: BrahuiEntry): string {
  const headword = `<b lang="brh">${escapeHtml(entry.latin)}</b>`;
  const script = entry.script
    ? ` ${ISOLATE_START}${escapeHtml(entry.script)}${ISOLATE_END}`
    : "";
  const pos = entry.pos ? ` ${escapeHtml(entry.pos)}` : "";
  return `${headword}${script}${pos} — ${escapeHtml(entry.gloss)}`;
}

function groupMarkup(group: BrahuiLetterGroup): string {
  return group.entries.map(entryMarkup).join("\n");
}

export default function BrahuiWordIndex({ groups }: { groups: BrahuiLetterGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);

  return (
    <section
      aria-labelledby="brahui-word-index"
      className="rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-7"
    >
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-700)]">
          Complete word list
        </p>
        <h2
          id="brahui-word-index"
          className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[var(--ink-900)] sm:text-3xl"
        >
          {/* One template literal, not `All {expr} Brahui`: JSX dropped the space
              after the interpolation and the heading read "All 3,473Brahui words". */}
          {`All ${total.toLocaleString()} Brahui words, A–Z`}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Every headword with its Brahui script, part of speech and English meaning.
          Open a letter to read it, or search inside the dictionary above.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {groups.map((group) => {
          const anchor = group.letter === "#" ? "other" : group.letter;

          return (
            <details key={group.letter} className="group">
              <summary
                id={`brahui-letter-${anchor}`}
                className="flex cursor-pointer scroll-mt-24 list-none items-baseline gap-3 rounded-[var(--radius-sm)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-4 py-2.5 transition-colors hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
              >
                <span
                  aria-hidden="true"
                  className="text-[10px] text-[var(--accent-700)] transition-transform group-open:rotate-90"
                >
                  ▶
                </span>
                <span className="text-base font-bold text-[var(--ink-900)]">
                  {group.letter}
                </span>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                  {group.entries.length} words
                </span>
              </summary>

              {/*
                Columns keep the reading measure short the way a printed dictionary
                does; the hanging indent sets each headword against its definition.
              */}
              <p
                className="mt-2 whitespace-pre-line px-4 pb-2 text-[13px] leading-6 text-[var(--muted-foreground)] [text-indent:-1.25rem] [padding-left:2.5rem] [&_b]:font-bold [&_b]:text-[var(--ink-900)] sm:columns-2 sm:gap-x-10 xl:columns-3"
                dangerouslySetInnerHTML={{ __html: groupMarkup(group) }}
              />
            </details>
          );
        })}
      </div>
    </section>
  );
}
