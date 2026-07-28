export type CsvDelimiter = "auto" | "," | ";" | "\t" | "|";
export type CsvValue = string | number | boolean | null;

export type CsvParseOptions = {
  delimiter?: CsvDelimiter;
  inferTypes?: boolean;
  trimValues?: boolean;
};

export type CsvParseResult = {
  delimiter: Exclude<CsvDelimiter, "auto">;
  headers: string[];
  records: Array<Record<string, CsvValue>>;
  rows: CsvValue[][];
};

const delimiterCandidates = [",", ";", "\t", "|"] as const;

function parseRows(source: string, delimiter: Exclude<CsvDelimiter, "auto">) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let quoteClosed = false;

  function finishCell() {
    row.push(cell);
    cell = "";
    quoteClosed = false;
  }

  function finishRow() {
    finishCell();
    if (row.some((value) => value.length > 0)) rows.push(row);
    row = [];
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quoted) {
      if (character === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        quoteClosed = true;
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && !cell.trim() && !quoteClosed) {
      cell = "";
      quoted = true;
    } else if (character === delimiter) {
      finishCell();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && next === "\n") index += 1;
      finishRow();
    } else if (quoteClosed && /\s/.test(character)) {
      continue;
    } else if (quoteClosed) {
      throw new Error(
        `Unexpected character after a closing quote near character ${index + 1}.`,
      );
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  if (cell.length || row.length) finishRow();
  return rows;
}

function detectDelimiter(source: string) {
  const ranked = delimiterCandidates
    .map((delimiter) => {
      try {
        const rows = parseRows(source, delimiter);
        const width = rows[0]?.length ?? 0;
        const consistent = rows.filter((row) => row.length === width).length;
        return {
          delimiter,
          score: width > 1 ? consistent * 100 + width : 0,
        };
      } catch {
        return { delimiter, score: -1 };
      }
    })
    .sort((first, second) => second.score - first.score);
  if ((ranked[0]?.score ?? 0) <= 0) {
    throw new Error(
      "No table delimiter was detected. Choose a delimiter or add multiple columns.",
    );
  }
  return ranked[0].delimiter;
}

function inferValue(value: string): CsvValue {
  const normalized = value.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "null") return null;
  if (
    /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return value;
}

export function parseCsv(
  input: string,
  {
    delimiter = "auto",
    inferTypes = false,
    trimValues = true,
  }: CsvParseOptions = {},
): CsvParseResult {
  const source = input.replace(/^\uFEFF/, "");
  const resolvedDelimiter =
    delimiter === "auto" ? detectDelimiter(source) : delimiter;
  const rawRows = parseRows(source, resolvedDelimiter);
  if (rawRows.length < 2) {
    throw new Error("Add a header row and at least one data row.");
  }

  const headers = rawRows[0].map((header) =>
    trimValues ? header.trim() : header,
  );
  if (headers.some((header) => !header)) {
    throw new Error("Every CSV column needs a non-empty header.");
  }
  const normalizedHeaders = headers.map((header) => header.toLocaleLowerCase());
  const duplicate = normalizedHeaders.find(
    (header, index) => normalizedHeaders.indexOf(header) !== index,
  );
  if (duplicate) {
    throw new Error(
      `The header “${headers[normalizedHeaders.indexOf(duplicate)]}” is duplicated.`,
    );
  }

  const values = rawRows.slice(1).map((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(
        `Row ${index + 2} has ${row.length} column${row.length === 1 ? "" : "s"}; expected ${headers.length}.`,
      );
    }
    return row.map((value) => {
      const normalized = trimValues ? value.trim() : value;
      return inferTypes ? inferValue(normalized) : normalized;
    });
  });

  return {
    delimiter: resolvedDelimiter,
    headers,
    rows: values,
    records: values.map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] ?? ""]),
      ),
    ),
  };
}

export function csvDelimiterLabel(delimiter: Exclude<CsvDelimiter, "auto">) {
  if (delimiter === ",") return "Comma";
  if (delimiter === ";") return "Semicolon";
  if (delimiter === "\t") return "Tab";
  return "Pipe";
}
