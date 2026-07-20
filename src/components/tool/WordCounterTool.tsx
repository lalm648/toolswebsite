"use client";

import { useMemo, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STANDARD_LINE_LENGTH = 80;

const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function countCharacters(text: string) {
  // Count user-perceived characters (graphemes) so emoji and accented/astral
  // characters count as one, not as multiple UTF-16 code units.
  if (!text) {
    return 0;
  }

  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text)).length;
  }

  return [...text].length;
}

function countWords(text: string) {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

function countSentences(text: string) {
  const matches = text.trim().match(/[^.!?]+[.!?]+(\s|$)/g);
  return matches ? matches.length : text.trim() ? 1 : 0;
}

function countStandardLines(text: string) {
  if (!text) {
    return 0;
  }

  return text.split(/\r?\n/).reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / STANDARD_LINE_LENGTH));
  }, 0);
}

function countParagraphs(text: string) {
  if (!text.trim()) {
    return 0;
  }

  // Paragraphs are blocks separated by one or more blank lines.
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean).length;
}

export default function WordCounterTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const words = countWords(text);
    const charactersWithSpaces = countCharacters(text);
    const charactersNoSpaces = countCharacters(text.replace(/\s/g, ""));
    const lines = text ? text.split(/\r?\n/).length : 0;
    const standardLines = countStandardLines(text);
    const sentences = countSentences(text);
    const paragraphs = countParagraphs(text);
    const readingMinutes = words ? Math.max(1, Math.ceil(words / 200)) : 0;

    return {
      words,
      charactersWithSpaces,
      charactersNoSpaces,
      lines,
      standardLines,
      sentences,
      paragraphs,
      readingMinutes,
    };
  }, [text]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Paste your text</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Count words, characters, lines, and paragraphs instantly in the browser.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">Live analysis</Badge>
              <Button size="sm" variant="ghost" disabled={!text} onClick={() => setText("")}>Clear</Button>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Start typing or paste text here..."
            className="mt-5 min-h-[360px]"
          />
        </div>
      </div>

      <ToolResult title="Text statistics">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Words", stats.words],
            ["Characters", stats.charactersWithSpaces],
            ["No spaces", stats.charactersNoSpaces],
            ["Sentences", stats.sentences],
            ["Lines", stats.lines],
            ["Paragraphs", stats.paragraphs],
            [`Std. lines (${STANDARD_LINE_LENGTH})`, stats.standardLines],
            ["Reading time", stats.readingMinutes ? `${stats.readingMinutes} min` : "0 min"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--ink-900)]">{value}</p>
            </div>
          ))}
        </div>
      </ToolResult>
    </div>
  );
}
