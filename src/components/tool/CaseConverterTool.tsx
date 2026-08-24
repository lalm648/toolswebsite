"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Words that stay lowercase inside a title unless they open or close it.
const titleCaseMinorWords = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "if", "in", "into",
  "nor", "of", "on", "onto", "or", "over", "per", "so", "the", "to", "up",
  "via", "vs", "with", "yet",
]);

/**
 * An all-caps run of two or more letters is treated as an acronym and left alone.
 * Without this, lowercasing the whole string first turned "NASA" into "Nasa".
 */
function isAcronym(word: string) {
  return word.length > 1 && word === word.toUpperCase() && /\p{L}/u.test(word);
}

function capitalizeFirst(word: string) {
  return word.replace(/\p{L}/u, (char) => char.toUpperCase());
}

/** Splits into words and the separators between them, so joining restores the input. */
function tokenize(text: string) {
  return text.split(/([^\p{L}\p{N}']+)/u);
}

function toTitleCase(text: string) {
  const tokens = tokenize(text);
  const wordIndexes = tokens
    .map((token, index) => (/[\p{L}\p{N}]/u.test(token) ? index : -1))
    .filter((index) => index >= 0);
  const firstWord = wordIndexes[0];
  const lastWord = wordIndexes[wordIndexes.length - 1];

  return tokens
    .map((token, index) => {
      if (!/[\p{L}\p{N}]/u.test(token)) return token;
      if (isAcronym(token)) return token;

      const lower = token.toLowerCase();

      if (titleCaseMinorWords.has(lower) && index !== firstWord && index !== lastWord) {
        return lower;
      }

      return capitalizeFirst(lower);
    })
    .join("");
}

function toSentenceCase(text: string) {
  const lowered = tokenize(text)
    .map((token) => (isAcronym(token) ? token : token.toLowerCase()))
    .join("");

  return lowered.replace(
    /(^\s*\p{L})|([.!?]\s+\p{L})|(\n\s*\p{L})/gu,
    (match) => match.toUpperCase()
  );
}

function splitWords(text: string) {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function toPascalCase(text: string) {
  return splitWords(text)
    .map((word) => (isAcronym(word) ? word : capitalizeFirst(word.toLowerCase())))
    .join("");
}

function toConstantCase(text: string) {
  return splitWords(text)
    .map((word) => word.toUpperCase())
    .join("_");
}

function toCamelCase(text: string) {
  return splitWords(text)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return isAcronym(word) ? word : capitalizeFirst(word.toLowerCase());
    })
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
      ["PascalCase", toPascalCase(text)],
      ["snake_case", toSnakeCase(text)],
      ["kebab-case", toKebabCase(text)],
      ["CONSTANT_CASE", toConstantCase(text)],
    ] as const,
    [text]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[var(--ink-900)]">Source text</h2>
          <Button size="sm" variant="ghost" disabled={!text} onClick={() => setText("")}>Clear</Button>
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Paste text once and switch between common case formats instantly.
        </p>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste text here..."
          className="mt-5 min-h-[360px] resize-none"
        />
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">{(text.trim().match(/\S+/g)?.length ?? 0).toLocaleString()} words · {text.length.toLocaleString()} characters · {text ? text.split(/\r?\n/).length.toLocaleString() : 0} lines</p>
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
              <Textarea readOnly value={value} className="mt-3 min-h-20 resize-none" />
            </div>
          ))}
        </div>
      </ToolResult>
    </div>
  );
}
