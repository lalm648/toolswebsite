"use client";

import { useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { PrivacyNotice, ProcessingProgress, WorkbenchError } from "@/components/tool/WorkbenchStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";
import {
  csvDelimiterLabel,
  type CsvDelimiter,
  type CsvParseResult,
} from "@/lib/tools/csv";

type DataUtilityWorkbenchProps = {
  slug: string;
};

type SqlColumn = {
  name: string;
  type: string;
  primary: boolean;
  foreign: boolean;
  reference?: string;
};

type SqlRelationship = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

type SqlSchema = {
  mermaid: string;
  tables: Array<{ name: string; columns: SqlColumn[] }>;
  relationships: SqlRelationship[];
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
  const tableSources: Array<{ name: string; body: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = tableExpression.exec(source))) {
    tableSources.push({ name: match[1], body: match[2] });
  }

  if (!tableSources.length)
    throw new Error("No terminated CREATE TABLE statements were found.");

  const relationships: SqlRelationship[] = [];
  const tables = tableSources.map((table) => {
    const lines = splitSqlColumns(table.body);
    const columns = lines
      .filter(
        (line) =>
          !/^(PRIMARY|FOREIGN|UNIQUE|CONSTRAINT|CHECK)\b/i.test(line.trim()),
      )
      .map((column): SqlColumn | null => {
        const parts = column
          .replace(/["`\[\]]/g, "")
          .trim()
          .split(/\s+/);
        if (parts.length < 2) return null;
        const reference = column.match(
          /\bREFERENCES\s+["`\[]?([\w.-]+)["`\]]?\s*\(\s*["`\[]?(\w+)/i,
        );
        const parsed = {
          name: parts[0],
          type: parts[1],
          primary: /PRIMARY\s+KEY/i.test(column),
          foreign: Boolean(reference),
          reference: reference ? `${reference[1]}.${reference[2]}` : undefined,
        };
        if (reference) {
          relationships.push({
            fromTable: table.name,
            fromColumn: parsed.name,
            toTable: reference[1],
            toColumn: reference[2],
          });
        }
        return parsed;
      })
      .filter((column): column is SqlColumn => column !== null);

    for (const line of lines) {
      const relation = line.match(
        /FOREIGN\s+KEY\s*\(\s*["`\[]?(\w+)["`\]]?\s*\)\s+REFERENCES\s+["`\[]?([\w.-]+)["`\]]?\s*\(\s*["`\[]?(\w+)/i,
      );
      if (
        relation &&
        !relationships.some(
          (item) =>
            item.fromTable === table.name &&
            item.fromColumn === relation[1] &&
            item.toTable === relation[2] &&
            item.toColumn === relation[3],
        )
      ) {
        relationships.push({
          fromTable: table.name,
          fromColumn: relation[1],
          toTable: relation[2],
          toColumn: relation[3],
        });
        const column = columns.find((item) => item.name === relation[1]);
        if (column) {
          column.foreign = true;
          column.reference = `${relation[2]}.${relation[3]}`;
        }
      }
    }
    return { name: table.name, columns };
  });

  const lines = ["erDiagram"];
  for (const table of tables) {
    lines.push(`  ${table.name.replace(/\W/g, "_")} {`);
    for (const column of table.columns) {
      const markers = [
        column.primary ? "PK" : "",
        column.foreign ? "FK" : "",
      ]
        .filter(Boolean)
        .join(",");
      lines.push(
        `    ${column.type.replace(/\W/g, "_")} ${column.name.replace(/\W/g, "_")}${markers ? ` ${markers}` : ""}`,
      );
    }
    lines.push("  }");
  }

  for (const relationship of relationships) {
    lines.push(
      `  ${relationship.toTable.replace(/\W/g, "_")} ||--o{ ${relationship.fromTable.replace(/\W/g, "_")} : "${relationship.fromColumn}"`,
    );
  }

  return { mermaid: lines.join("\n"), tables, relationships } satisfies SqlSchema;
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
  const [schema, setSchema] = useState<SqlSchema | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeType, setCodeType] = useState<"javascript" | "css">("javascript");
  const [mangleJavascript, setMangleJavascript] = useState(false);
  const [restructureCss, setRestructureCss] = useState(true);
  const [csvDelimiter, setCsvDelimiter] = useState<CsvDelimiter>("auto");
  const [inferCsvTypes, setInferCsvTypes] = useState(false);
  const [trimCsvValues, setTrimCsvValues] = useState(true);
  const [csvReport, setCsvReport] = useState<CsvParseResult | null>(null);

  async function processInput() {
    setBusy(true);
    setError("");
    try {
      if (slug === "csv-to-json") {
        const csv = await import("@/lib/tools/csv");
        const report = csv.parseCsv(input, {
          delimiter: csvDelimiter,
          inferTypes: inferCsvTypes,
          trimValues: trimCsvValues,
        });
        setCsvReport(report);
        setOutput(JSON.stringify(report.records, null, 2));
      } else if (slug === "sql-schema-visualizer") {
        const nextSchema = visualizeSql(input);
        setSchema(nextSchema);
        setOutput(nextSchema.mermaid);
      } else if (slug === "code-minifier") {
        const minifiers = await import("@/lib/tools/code-minify");
        setOutput(
          codeType === "css"
            ? minifiers.minifyCss(input, { restructure: restructureCss })
            : await minifiers.minifyJavascript(input, {
                mangle: mangleJavascript,
              }),
        );
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
      setSchema(null);
      setCsvReport(null);
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
      action: "Visualize schema",
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

  function resetWorkbench() {
    setInput(examples[slug] ?? "");
    setSecondary(slug === "diff-checker" ? "const count = items.length;\nreturn count;" : "");
    setOutput("");
    setSchema(null);
    setCsvReport(null);
    setError("");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[1.35rem] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
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
        {slug === "code-minifier" ? (
          <div className="mb-4 space-y-3">
            <label className="block text-sm font-semibold text-[var(--ink-900)]">
              Source language
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
                value={codeType}
                onChange={(event) => {
                  setCodeType(event.target.value as "javascript" | "css");
                  setOutput("");
                  setError("");
                }}
              >
                <option value="javascript">JavaScript · Terser parser</option>
                <option value="css">CSS · CSSO parser</option>
              </select>
            </label>
            {codeType === "javascript" ? (
              <label className="flex items-start gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-xs leading-5">
                <input
                  className="mt-1 accent-[var(--accent-500)]"
                  type="checkbox"
                  checked={mangleJavascript}
                  onChange={(event) => setMangleJavascript(event.target.checked)}
                />
                <span>
                  <strong className="block text-[var(--ink-900)]">
                    Shorten local identifiers
                  </strong>
                  Leave this off when code relies on function or variable names
                  at runtime.
                </span>
              </label>
            ) : (
              <label className="flex items-start gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-xs leading-5">
                <input
                  className="mt-1 accent-[var(--accent-500)]"
                  type="checkbox"
                  checked={restructureCss}
                  onChange={(event) => setRestructureCss(event.target.checked)}
                />
                <span>
                  <strong className="block text-[var(--ink-900)]">
                    Optimize and restructure rules
                  </strong>
                  Disable this for conservative whitespace-and-token
                  minification only.
                </span>
              </label>
            )}
          </div>
        ) : null}
        {slug === "csv-to-json" ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-[var(--ink-900)]">
              Delimiter
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-3"
                value={csvDelimiter}
                onChange={(event) => {
                  setCsvDelimiter(event.target.value as CsvDelimiter);
                  setCsvReport(null);
                  setOutput("");
                }}
              >
                <option value="auto">Detect automatically</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value={"\t"}>Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-xs leading-5 sm:mt-7">
              <input
                type="checkbox"
                checked={trimCsvValues}
                onChange={(event) => setTrimCsvValues(event.target.checked)}
              />
              Trim outer whitespace
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-xs leading-5 sm:mt-7">
              <input
                type="checkbox"
                checked={inferCsvTypes}
                onChange={(event) => setInferCsvTypes(event.target.checked)}
              />
              Infer numbers, booleans, null
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" onClick={() => void processInput()} disabled={busy || !input.trim()}>{current.action}</Button>
          <Button type="button" variant="secondary" onClick={resetWorkbench}>Reset</Button>
        </div>
        <ProcessingProgress active={busy} label="Processing input" />
        <PrivacyNotice />
        <WorkbenchError message={error} />
      </section>

      <section className="rounded-[1.35rem] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
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
        {slug === "csv-to-json" && csvReport ? (
          <div className="mt-4 space-y-4">
            <dl className="grid grid-cols-3 gap-2">
              {[
                ["Rows", csvReport.records.length],
                ["Columns", csvReport.headers.length],
                ["Delimiter", csvDelimiterLabel(csvReport.delimiter)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {label}
                  </dt>
                  <dd className="mt-1 font-bold text-[var(--ink-900)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="max-h-80 overflow-auto rounded-xl border border-[var(--outline-soft)]">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-[var(--surface-panel)]">
                  <tr>
                    {csvReport.headers.map((header) => (
                      <th key={header} className="px-3 py-2.5 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvReport.rows.slice(0, 12).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-t border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                    >
                      {row.map((value, columnIndex) => (
                        <td
                          key={`${rowIndex}-${columnIndex}`}
                          className="max-w-64 truncate px-3 py-2.5 font-mono"
                          title={String(value)}
                        >
                          {value === null ? "null" : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvReport.records.length > 12 ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Previewing 12 of {csvReport.records.length.toLocaleString()} rows.
                The copied and downloaded JSON includes every row.
              </p>
            ) : null}
            <details className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)]">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                JSON output
              </summary>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-[var(--outline-soft)] p-4 text-xs leading-6">
                {output}
              </pre>
            </details>
          </div>
        ) : slug === "sql-schema-visualizer" && schema ? (
          <div className="mt-4 space-y-4">
            <dl className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Tables</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--ink-900)]">{schema.tables.length}</dd>
              </div>
              <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Columns</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--ink-900)]">{schema.tables.reduce((sum, table) => sum + table.columns.length, 0)}</dd>
              </div>
              <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Relations</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--ink-900)]">{schema.relationships.length}</dd>
              </div>
            </dl>
            <div className="grid gap-3 sm:grid-cols-2">
              {schema.tables.map((table) => (
                <section key={table.name} className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)]">
                  <h3 className="border-b border-[var(--outline-soft)] bg-[var(--surface-cta)] px-4 py-3 font-mono text-sm font-bold text-white">{table.name}</h3>
                  <ul className="divide-y divide-[var(--outline-soft)]">
                    {table.columns.map((column) => (
                      <li key={`${table.name}-${column.name}`} className="flex items-start gap-3 px-4 py-2.5 text-xs">
                        <span className="min-w-0 flex-1">
                          <span className="block break-all font-mono font-semibold text-[var(--ink-900)]">{column.name}</span>
                          {column.reference ? <span className="mt-0.5 block break-all text-[10px] text-[var(--muted-foreground)]">→ {column.reference}</span> : null}
                        </span>
                        <span className="font-mono text-[var(--muted-foreground)]">{column.type}</span>
                        {column.primary ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">PK</span> : null}
                        {column.foreign ? <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">FK</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {schema.relationships.length ? (
              <section className="rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-700)]">Relationships</h3>
                <ul className="mt-3 space-y-2">
                  {schema.relationships.map((relationship, index) => (
                    <li key={`${relationship.fromTable}-${relationship.fromColumn}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--surface-card)] px-3 py-2 font-mono text-xs text-[var(--ink-900)]">
                      <span>{relationship.fromTable}.{relationship.fromColumn}</span>
                      <span className="font-sans font-bold text-[var(--accent-700)]">→</span>
                      <span>{relationship.toTable}.{relationship.toColumn}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <details className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)]">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--ink-900)]">Mermaid ER source</summary>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-[var(--outline-soft)] p-4 text-xs leading-6">{schema.mermaid}</pre>
            </details>
          </div>
        ) : (
          <pre className="mt-4 min-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--foreground)]">
            {slug === "diff-checker" && output
              ? output.split("\n").map((line, index) => (
                  <span key={index} className={`block px-1 ${line.startsWith("+") ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200" : line.startsWith("-") ? "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200" : ""}`}>{line || " "}</span>
                ))
              : output || "Your processed result will appear here."}
          </pre>
        )}
        {output ? (
          <p className="mt-2 text-xs tabular-nums text-[var(--muted-foreground)]">
            {output.split(/\r?\n/).length.toLocaleString()} lines · {output.length.toLocaleString()} characters
            {slug === "code-minifier" && input.length ? ` · ${Math.max(0, ((input.length - output.length) / input.length) * 100).toFixed(1)}% fewer characters` : ""}
          </p>
        ) : null}
      </section>
    </div>
  );
}
