"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";

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

// Common abbreviations whose full stop does not end a sentence.
const abbreviations =
  /\b(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|approx|dept|est|fig|no|vol|al)\.$/i;

function countSentences(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Split on terminal punctuation followed by whitespace, then discard the breaks that
  // are really decimals ("3.5"), initials ("J. Smith"), or abbreviations ("e.g.").
  const parts = trimmed.split(/(?<=[.!?])\s+/);
  let count = 0;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!/\p{L}|\p{N}/u.test(part)) continue;

    const isNonTerminal =
      abbreviations.test(part) ||
      /\b\p{Lu}\.$/u.test(part) || // a single initial such as "J."
      /\d\.$/.test(part); // a decimal split across the boundary

    if (isNonTerminal && index < parts.length - 1) continue;

    count += 1;
  }

  return Math.max(1, count);
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

/** Approximate English syllable count — enough for a Flesch reading-ease estimate. */
function countSyllables(word: string) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  const groups = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);

  return groups ? groups.length : 1;
}

function getReadability(text: string, words: number, sentences: number) {
  if (words < 10 || !sentences) return null;

  const syllables = (text.match(/[A-Za-z']+/g) ?? []).reduce(
    (total, word) => total + countSyllables(word),
    0
  );
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const bounded = Math.max(0, Math.min(100, score));

  const label =
    bounded >= 80
      ? "Very easy"
      : bounded >= 60
        ? "Plain English"
        : bounded >= 50
          ? "Fairly hard"
          : bounded >= 30
            ? "Difficult"
            : "Very difficult";

  return { score: Math.round(bounded), label };
}

const stopWords = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "is", "are", "was", "were", "be", "been", "it", "its", "this", "that",
  "these", "those", "as", "by", "from", "you", "your", "we", "our", "they",
  "their", "he", "she", "his", "her", "not", "so", "if", "then", "than", "can",
  "will", "would", "there", "have", "has", "had", "do", "does", "did", "i",
]);

function getKeywordDensity(text: string) {
  const words = (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []).filter(
    (word) => word.length > 2 && !stopWords.has(word)
  );

  if (!words.length) return [];

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word, count]) => ({
      word,
      count,
      percent: (count / words.length) * 100,
    }));
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
    const speakingMinutes = words ? Math.max(1, Math.ceil(words / 130)) : 0;
    const readability = getReadability(text, words, sentences);

    return {
      words,
      charactersWithSpaces,
      charactersNoSpaces,
      lines,
      standardLines,
      sentences,
      paragraphs,
      readingMinutes,
      speakingMinutes,
      readability,
    };
  }, [text]);

  const topWords = useMemo(() => getKeywordDensity(text), [text]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Paste your text</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Count words, characters, lines, and paragraphs instantly in the browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">Live analysis</Badge>
              <CopyButton value={text} label="Copy text" disabled={!text} />
              <Button
                size="sm"
                variant="secondary"
                disabled={!text}
                onClick={() => downloadTextFile(text, "word-count.txt", "text/plain")}
              >
                Download .txt
              </Button>
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
            ["Speaking time", stats.speakingMinutes ? `${stats.speakingMinutes} min` : "0 min"],
            [
              "Readability",
              stats.readability ? `${stats.readability.score} · ${stats.readability.label}` : "—",
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--ink-900)]">{value}</p>
            </div>
          ))}
        </div>

        {topWords.length ? (
          <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Most used words
            </p>
            <ul className="mt-3 space-y-2">
              {topWords.map((entry) => (
                <li key={entry.word} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--ink-900)]">
                    {entry.word}
                  </span>
                  <span
                    className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--outline-soft)]"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--accent-500)]"
                      style={{
                        width: `${Math.min(100, (entry.count / topWords[0].count) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums text-[var(--muted-foreground)]">
                    {entry.count} · {entry.percent.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </ToolResult>
    </div>
  );
}
