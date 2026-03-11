"use client";

import { useMemo, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function toTitleCase(text: string) {
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

export default function CaseConverterTool() {
  const [text, setText] = useState("");

  const variants = useMemo(
    () => ({
      uppercase: text.toUpperCase(),
      lowercase: text.toLowerCase(),
      title: toTitleCase(text),
      sentence: toSentenceCase(text),
    }),
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
          {[
            ["UPPERCASE", variants.uppercase],
            ["lowercase", variants.lowercase],
            ["Title Case", variants.title],
            ["Sentence case", variants.sentence],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--ink-900)]">{label}</p>
                <Button size="sm" variant="secondary" onClick={() => setText(String(value))}>
                  Use this
                </Button>
              </div>
              <Textarea readOnly value={String(value)} className="mt-3 min-h-24" />
            </div>
          ))}
        </div>
      </ToolResult>
    </div>
  );
}
