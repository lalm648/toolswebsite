"use client";

import { useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function formatJson() {
    try {
      const parsed = JSON.parse(input);
      const nextOutput = JSON.stringify(parsed, null, 2);
      setOutput(nextOutput);
      setError("");
      trackEvent("format_json", {
        tool_slug: "json-formatter",
        input_length: input.length,
        output_length: nextOutput.length,
      });
    } catch {
      setOutput("");
      setError("Invalid JSON. Check commas, quotes, and brackets.");
      trackToolFailure("json-formatter", "format", "invalid_json", {
        input_length: input.length,
      });
    }
  }

  function minifyJson() {
    try {
      const parsed = JSON.parse(input);
      const nextOutput = JSON.stringify(parsed);
      setOutput(nextOutput);
      setError("");
      trackEvent("minify_json", {
        tool_slug: "json-formatter",
        input_length: input.length,
        output_length: nextOutput.length,
      });
    } catch {
      setOutput("");
      setError("Invalid JSON. Check commas, quotes, and brackets.");
      trackToolFailure("json-formatter", "minify", "invalid_json", {
        input_length: input.length,
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Paste JSON</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Format or minify JSON data directly in the browser.
        </p>
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"name":"ToolsWebsite","type":"formatter"}'
          className="mt-5 min-h-[360px] font-mono text-sm"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={formatJson}>Format JSON</Button>
          <Button variant="secondary" onClick={minifyJson}>
            Minify JSON
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-[var(--brand-600)]">{error}</p> : null}
      </div>

      <ToolResult title="Formatted output">
        <Textarea readOnly value={output} placeholder="Formatted JSON will appear here..." className="min-h-[360px] font-mono text-sm" />
      </ToolResult>
    </div>
  );
}
