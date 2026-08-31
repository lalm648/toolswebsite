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
    // Brahui headwords carry Latin diacritics (á, í, ú, …). Strip them via NFD
    // decomposition before grouping so "ábád" buckets under "A", not under "#".
    const base = entry.latin.normalize("NFD").replace(/[̀-ͯ]/g, "");
    const first = base.charAt(0).toUpperCase();
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
