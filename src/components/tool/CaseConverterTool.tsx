"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function toTitleCase(text: string) {
  // Capitalize the first letter of each word (start-of-string or after whitespace),
  // leaving letters after apostrophes/hyphens untouched so "don't" -> "Don't".
  return text.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_match, sep, char) => sep + char.toUpperCase());
}

function toSentenceCase(text: string) {
  // Capitalize the first letter of each sentence, including after line breaks.
  return text
    .toLowerCase()
    .replace(/(^\s*\p{L})|([.!?]\s+\p{L})|(\n\s*\p{L})/gu, (match) => match.toUpperCase());
}

function splitWords(text: string) {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function toCamelCase(text: string) {
  return splitWords(text)
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

function toSnakeCase(text: string) {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("_");
}

function toKebabCase(text: string) {
  return splitWords(text)
    .map((word) => word.toLowerCase())
    .join("-");
}

export default function CaseConverterTool() {
  const [text, setText] = useState("");

  const variants = useMemo(
    () => [
      ["UPPERCASE", text.toUpperCase()],
      ["lowercase", text.toLowerCase()],
      ["Title Case", toTitleCase(text)],
      ["Sentence case", toSentenceCase(text)],
      ["camelCase", toCamelCase(text)],
      ["snake_case", toSnakeCase(text)],
      ["kebab-case", toKebabCase(text)],
    ] as const,
    [text]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold text-[var(--ink-900)]">Source text</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Paste text once and switch between common case formats instantly.
        </p>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste text here..."
          className="mt-5 min-h-[360px]"
        />
      </div>

      <ToolResult title="Converted text">
        <div className="space-y-4">
          {variants.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--ink-900)]">{label}</p>
                <div className="flex gap-2">
                  <CopyButton value={value} disabled={!value} />
                  <Button size="sm" variant="ghost" onClick={() => setText(value)} disabled={!value}>
                    Use this
                  </Button>
                </div>
              </div>
              <Textarea readOnly value={value} className="mt-3 min-h-20" />
            </div>
          ))}
        </div>
      </ToolResult>
    </div>
  );
}
