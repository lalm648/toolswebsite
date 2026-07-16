"use client";

import { useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";

type DataUtilityWorkbenchProps = {
  slug: string;
};

const examples: Record<string, string> = {
  "csv-to-json":
    "name,email,active\nAda,ada@example.com,true\nLinus,linus@example.com,false",
  "sql-schema-visualizer":
    "CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  email VARCHAR(255) NOT NULL\n);\n\nCREATE TABLE posts (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id),\n  title VARCHAR(255)\n);",
  "code-minifier":
    "function greet(name) {\n  // Build the message shown to the user\n  const message = `Hello, ${name}!`;\n  return message;\n}",
  "regex-tester": "Contact ada@example.com or team@example.org for details.",
  "diff-checker": "const total = items.length;\nreturn total;",
};

function parseCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  if (quoted) throw new Error("The CSV contains an unclosed quoted value.");
  if (rows.length < 2)
    throw new Error("Add a header row and at least one data row.");

  const headers = rows[0].map((header) => header.trim());
  if (headers.some((header) => !header))
    throw new Error("Every CSV column needs a header.");

  return rows
    .slice(1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
}

function splitSqlColumns(body: string) {
  const columns: string[] = [];
  let current = "";
  let depth = 0;

  for (const character of body) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      columns.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) columns.push(current.trim());
  return columns;
}

function visualizeSql(source: string) {
  const tableExpression =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?([\w.-]+)["`\]]?\s*\(([\s\S]*?)\)\s*;/gi;
  const tables: Array<{ name: string; columns: string[] }> = [];
  let match: RegExpExecArray | null;

  while ((match = tableExpression.exec(source))) {
    const columns = splitSqlColumns(match[2]).filter(
      (line) => !/^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK)\b/i.test(line),
    );
    tables.push({ name: match[1], columns });
  }

  if (!tables.length)
    throw new Error("No terminated CREATE TABLE statements were found.");

  const lines = ["erDiagram"];
  for (const table of tables) {
    lines.push(`  ${table.name.replace(/\W/g, "_")} {`);
    for (const column of table.columns) {
      const parts = column
        .replace(/["`\[\]]/g, "")
        .trim()
        .split(/\s+/);
      if (parts.length < 2) continue;
      const [name, type] = parts;
      const markers = [
        /PRIMARY\s+KEY/i.test(column) ? "PK" : "",
        /REFERENCES/i.test(column) ? "FK" : "",
      ]
        .filter(Boolean)
        .join(",");
      lines.push(
        `    ${type.replace(/\W/g, "_")} ${name}${markers ? ` ${markers}` : ""}`,
      );
    }
    lines.push("  }");
  }

  const relationExpression =
    /(?:FOREIGN\s+KEY\s*\(\s*)?["`\[]?(\w+)["`\]]?\s*\)?\s+REFERENCES\s+["`\[]?([\w.-]+)["`\]]?\s*\(\s*["`\[]?(\w+)/gi;
  while ((match = relationExpression.exec(source))) {
    const owner = tables.find((table) =>
      table.columns.some((column) => column.includes(match?.[0] ?? "")),
    );
    if (owner)
      lines.push(
        `  ${match[2].replace(/\W/g, "_")} ||--o{ ${owner.name.replace(/\W/g, "_")} : "${match[1]}"`,
      );
  }

  return lines.join("\n");
}

function minifyCode(source: string) {
  let output = "";
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      output += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      output += character;
      continue;
    }
    if (/\s/.test(character)) {
      const previous = output.at(-1) ?? "";
      const upcoming = source.slice(index + 1).match(/\S/)?.[0] ?? "";
      if (/[$\w]/.test(previous) && /[$\w]/.test(upcoming)) output += " ";
      continue;
    }
    output += character;
  }

  return output.trim();
}

async function runRegex(pattern: string, flags: string, source: string) {
  if (pattern.length > 500 || source.length > 100_000) {
    throw new Error(
      "Keep patterns under 500 characters and test text under 100,000 characters.",
    );
  }

  const workerSource = `self.onmessage = ({data}) => { try { const flags = data.flags.includes('g') ? data.flags : data.flags + 'g'; const regex = new RegExp(data.pattern, flags); const matches = []; let match; while ((match = regex.exec(data.source)) && matches.length < 1000) { matches.push({ value: match[0], index: match.index, groups: match.slice(1) }); if (match[0] === '') regex.lastIndex += 1; } self.postMessage({matches}); } catch (error) { self.postMessage({error: error instanceof Error ? error.message : 'Invalid expression'}); } };`;
  const workerUrl = URL.createObjectURL(
    new Blob([workerSource], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);

  try {
    return await new Promise<
      Array<{ value: string; index: number; groups: string[] }>
    >((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        worker.terminate();
        reject(
          new Error("The expression exceeded the one-second safety limit."),
        );
      }, 1000);
      worker.onmessage = (event) => {
        window.clearTimeout(timeout);
        if (event.data.error) reject(new Error(event.data.error));
        else resolve(event.data.matches);
      };
      worker.postMessage({ pattern, flags, source });
    });
  } finally {
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  }
}

export default function DataUtilityWorkbench({
  slug,
}: DataUtilityWorkbenchProps) {
  const [input, setInput] = useState(examples[slug] ?? "");
  const [secondary, setSecondary] = useState(
    slug === "diff-checker" ? "const count = items.length;\nreturn count;" : "",
  );
  const [pattern, setPattern] = useState("[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}");
  const [flags, setFlags] = useState("gi");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function processInput() {
    setBusy(true);
    setError("");
    try {
      if (slug === "csv-to-json") {
        setOutput(JSON.stringify(parseCsv(input), null, 2));
      } else if (slug === "sql-schema-visualizer") {
        setOutput(visualizeSql(input));
      } else if (slug === "code-minifier") {
        setOutput(minifyCode(input));
      } else if (slug === "regex-tester") {
        const matches = await runRegex(pattern, flags, input);
        setOutput(
          matches.length
            ? matches
                .map(
                  (match, index) =>
                    `${index + 1}. index ${match.index}: ${JSON.stringify(match.value)}${match.groups.length ? `\n   groups: ${JSON.stringify(match.groups)}` : ""}`,
                )
                .join("\n")
            : "No matches found.",
        );
      } else if (slug === "diff-checker") {
        const { diffLines } = await import("diff");
        const changes = diffLines(input, secondary);
        setOutput(
          changes
            .map((change) =>
              change.value
                .split("\n")
                .filter(
                  (line, index, lines) => line || index < lines.length - 1,
                )
                .map(
                  (line) =>
                    `${change.added ? "+" : change.removed ? "-" : " "} ${line}`,
                )
                .join("\n"),
            )
            .join("\n"),
        );
      }
    } catch (caughtError) {
      setOutput("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "This input could not be processed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const labels: Record<
    string,
    { input: string; action: string; file: string }
  > = {
    "csv-to-json": {
      input: "CSV input",
      action: "Convert to JSON",
      file: "data.json",
    },
    "sql-schema-visualizer": {
      input: "SQL schema",
      action: "Build Mermaid chart",
      file: "schema.mmd",
    },
    "code-minifier": {
      input: "JavaScript or CSS",
      action: "Minify code",
      file: "minified.txt",
    },
    "regex-tester": {
      input: "Test text",
      action: "Run expression safely",
      file: "regex-matches.txt",
    },
    "diff-checker": {
      input: "Original text",
      action: "Compare text",
      file: "changes.diff",
    },
  };
  const current = labels[slug] ?? labels["code-minifier"];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        {slug === "regex-tester" ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_100px]">
            <label className="text-sm font-semibold text-[var(--ink-900)]">
              Pattern
              <Input
                className="mt-2 font-mono"
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-[var(--ink-900)]">
              Flags
              <Input
                className="mt-2 font-mono"
                value={flags}
                onChange={(event) =>
                  setFlags(event.target.value.replace(/[^dgimsuvy]/g, ""))
                }
              />
            </label>
          </div>
        ) : null}
        <label className="text-sm font-semibold text-[var(--ink-900)]">
          {current.input}
        </label>
        <Textarea
          className="mt-2 min-h-72 font-mono text-sm"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          spellCheck={false}
        />
        {slug === "diff-checker" ? (
          <>
            <label className="mt-4 block text-sm font-semibold text-[var(--ink-900)]">
              Changed text
            </label>
            <Textarea
              className="mt-2 min-h-52 font-mono text-sm"
              value={secondary}
              onChange={(event) => setSecondary(event.target.value)}
              spellCheck={false}
            />
          </>
        ) : null}
        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={() => void processInput()}
          disabled={busy || !input.trim()}
        >
          {busy ? "Processing…" : current.action}
        </Button>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Result
          </h2>
          <div className="flex gap-2">
            <CopyButton value={output} />
            <Button
              size="sm"
              variant="secondary"
              disabled={!output}
              onClick={() => downloadTextFile(output, current.file)}
            >
              Download
            </Button>
          </div>
        </div>
        <pre className="mt-4 min-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--foreground)]">
          {output || "Your processed result will appear here."}
        </pre>
      </section>
    </div>
  );
}
