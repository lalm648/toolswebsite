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
