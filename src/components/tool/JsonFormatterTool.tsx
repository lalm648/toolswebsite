"use client";

import { useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";
import { downloadTextFile } from "@/lib/download";
import { findPrecisionRisks, reformatJson } from "@/lib/tools/json-format";

const indentOptions = [
  { value: "2", label: "2 spaces" },
  { value: "4", label: "4 spaces" },
  { value: "tab", label: "Tabs" },
] as const;

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState<(typeof indentOptions)[number]["value"]>("2");
  const [preservedNumbers, setPreservedNumbers] = useState<string[]>([]);

  function run(mode: "format" | "minify") {
    const indentUnit =
      mode === "minify" ? "" : indent === "tab" ? "\t" : " ".repeat(Number(indent));
    const result = reformatJson(input, indentUnit);

    if (!result.ok) {
      setOutput("");
      setPreservedNumbers([]);
      setError(
        `Line ${result.error.line}, column ${result.error.column}: ${result.error.message}`
      );
      trackToolFailure("json-formatter", mode, "invalid_json", {
        input_length: input.length,
      });
      return;
    }

    setOutput(result.output);
    setError("");
    setPreservedNumbers(findPrecisionRisks(result.output));
    trackEvent(mode === "format" ? "format_json" : "minify_json", {
      tool_slug: "json-formatter",
      input_length: input.length,
      output_length: result.output.length,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Paste JSON</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Format or minify JSON data directly in the browser.
        </p>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"name":"Webutilia","type":"formatter"}'
          className="mt-5 min-h-[360px] resize-none font-mono text-sm"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => run("format")}>Format JSON</Button>
          <Button variant="secondary" onClick={() => run("minify")}>
            Minify JSON
          </Button>
          <label className="ml-auto flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            Indent
            <select
              value={indent}
              onChange={(event) =>
                setIndent(event.target.value as (typeof indentOptions)[number]["value"])
              }
              className="h-10 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink-900)]"
            >
              {indentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--error-foreground)]">{error}</p> : null}
        {preservedNumbers.length ? (
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Kept {preservedNumbers.length} high-precision{" "}
            {preservedNumbers.length === 1 ? "number" : "numbers"} exactly as written
            (for example <code className="font-mono">{preservedNumbers[0]}</code>).
          </p>
        ) : null}
      </div>

      <ToolResult title="Formatted output">
        <Textarea readOnly value={output} placeholder="Formatted JSON will appear here..." className="tool-output-scroll resize-none font-mono text-sm" />
        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton value={output} label="Copy JSON" disabled={!output} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadTextFile(output, "formatted.json", "application/json")}
            disabled={!output}
          >
            Download .json
          </Button>
        </div>
      </ToolResult>
    </div>
  );
}
