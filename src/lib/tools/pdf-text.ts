export type PdfTextItemLike = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

export type PdfTextMode = "reading-order" | "preserve-layout";

type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
};

function toPositionedItem(item: PdfTextItemLike): PositionedText | null {
  const text = item.str.normalize("NFKC");
  if (!text) return null;
  const transform = item.transform;
  return {
    text,
    x: Number(transform[4] ?? 0),
    y: Number(transform[5] ?? 0),
    width: Math.abs(Number(item.width ?? 0)),
    height: Math.max(
      Math.abs(Number(item.height ?? 0)),
      Math.hypot(Number(transform[2] ?? 0), Number(transform[3] ?? 0)),
      1,
    ),
    hasEOL: Boolean(item.hasEOL),
  };
}

function shouldInsertSpace(
  previous: PositionedText,
  current: PositionedText,
) {
  if (/\s$/.test(previous.text) || /^\s/.test(current.text)) return false;
  const averageCharacterWidth =
    previous.text.trim().length > 0
      ? previous.width / previous.text.trim().length
      : previous.height * 0.45;
  const gap = current.x - (previous.x + previous.width);
  if (gap > Math.max(0.75, averageCharacterWidth * 0.3)) return true;
  return /[\p{L}\p{N})\]]$/u.test(previous.text) &&
    /^[\p{L}\p{N}([]/u.test(current.text);
}

function cleanExtractedText(value: string, joinHyphenated: boolean) {
  let output = value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  if (joinHyphenated) {
    output = output.replace(/([\p{L}])-\n(?=[\p{Ll}])/gu, "$1");
  }
  return output;
}

function extractInContentOrder(items: PositionedText[]) {
  let output = "";
  let previous: PositionedText | null = null;
  let forceLineBreak = false;

  for (const current of items) {
    if (previous) {
      const lineTolerance = Math.max(previous.height, current.height) * 0.55;
      const changedLine =
        forceLineBreak ||
        Math.abs(current.y - previous.y) > lineTolerance ||
        current.x + current.width < previous.x;
      if (changedLine) {
        const verticalGap = Math.abs(current.y - previous.y);
        output +=
          verticalGap > Math.max(previous.height, current.height) * 1.65
            ? "\n\n"
            : "\n";
      } else if (shouldInsertSpace(previous, current)) {
        output += " ";
      }
    }
    output += current.text;
    forceLineBreak = current.hasEOL;
    previous = current;
  }

  return output;
}

function extractWithLayout(items: PositionedText[]) {
  const sorted = [...items].sort(
    (left, right) => right.y - left.y || left.x - right.x,
  );
  const lines: Array<{
    y: number;
    height: number;
    items: PositionedText[];
  }> = [];

  for (const item of sorted) {
    const line = lines.find(
      (candidate) =>
        Math.abs(candidate.y - item.y) <=
        Math.max(candidate.height, item.height) * 0.55,
    );
    if (line) {
      line.items.push(item);
      line.height = Math.max(line.height, item.height);
      line.y =
        line.items.reduce((sum, current) => sum + current.y, 0) /
        line.items.length;
    } else {
      lines.push({ y: item.y, height: item.height, items: [item] });
    }
  }

  lines.sort((left, right) => right.y - left.y);
  return lines
    .map((line, index) => {
      line.items.sort((left, right) => left.x - right.x);
      let text = "";
      let previous: PositionedText | null = null;
      for (const item of line.items) {
        if (previous) {
          const gap = item.x - (previous.x + previous.width);
          const averageWidth = Math.max(
            2,
            previous.width / Math.max(1, previous.text.trim().length),
          );
          const spaces =
            gap > averageWidth * 0.45
              ? Math.max(1, Math.min(12, Math.round(gap / averageWidth)))
              : shouldInsertSpace(previous, item)
                ? 1
                : 0;
          text += " ".repeat(spaces);
        }
        text += item.text;
        previous = item;
      }

      const next = lines[index + 1];
      const separator =
        next &&
        Math.abs(line.y - next.y) > Math.max(line.height, next.height) * 1.65
          ? "\n\n"
          : "\n";
      return `${text.trimEnd()}${next ? separator : ""}`;
    })
    .join("");
}

export function extractPdfPageText(
  sourceItems: PdfTextItemLike[],
  options: {
    mode: PdfTextMode;
    joinHyphenated: boolean;
  },
) {
  const items = sourceItems
    .map(toPositionedItem)
    .filter((item): item is PositionedText => item !== null);
  const raw =
    options.mode === "preserve-layout"
      ? extractWithLayout(items)
      : extractInContentOrder(items);
  const text = cleanExtractedText(raw, options.joinHyphenated);

  return {
    text,
    items: items.length,
    words: text ? text.split(/\s+/u).length : 0,
    characters: Array.from(text).length,
  };
}
