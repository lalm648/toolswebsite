"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";

type TextTransformToolProps = {
  title: string;
  description: string;
  outputTitle: string;
  transform: (value: string) => string;
  downloadFileName?: string;
};

export default function TextTransformTool({
  title,
  description,
  outputTitle,
  transform,
  downloadFileName = "cleaned-text.txt",
}: TextTransformToolProps) {
  const [text, setText] = useState("");

  const output = useMemo(() => transform(text), [text, transform]);
  const characterCount = text.length;
  const lineCount = text ? text.split(/\r\n|\r|\n/).length : 0;
  const wordCount = text.trim() ? (text.trim().match(/\S+/g)?.length ?? 0) : 0;
  const outputCharacterCount = output.length;
  const outputLineCount = output ? output.split(/\r\n|\r|\n/).length : 0;
  const outputWordCount = output.trim() ? (output.trim().match(/\S+/g)?.length ?? 0) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
          <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
            Live output
          </Badge>
        </div>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste text here..."
          className="mt-5 min-h-[360px]"
        />
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          {wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters · {lineCount.toLocaleString()} lines
        </p>
      </div>

      <ToolResult title={outputTitle}>
        <Textarea readOnly value={output} placeholder="Processed text will appear here..." className="min-h-[360px]" />
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          {outputWordCount.toLocaleString()} words · {outputCharacterCount.toLocaleString()} characters · {outputLineCount.toLocaleString()} lines
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CopyButton value={output} label="Copy result" disabled={!output} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadTextFile(output, downloadFileName)}
            disabled={!output}
          >
            Download .txt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setText(output)} disabled={!output}>
            Use output
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>
            Clear
          </Button>
        </div>
      </ToolResult>
    </div>
  );
}
