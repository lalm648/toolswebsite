"use client";

import { useMemo, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TextTransformToolProps = {
  title: string;
  description: string;
  outputTitle: string;
  transform: (value: string) => string;
};

export default function TextTransformTool({
  title,
  description,
  outputTitle,
  transform,
}: TextTransformToolProps) {
  const [text, setText] = useState("");

  const output = useMemo(() => transform(text), [text, transform]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
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
      </div>

      <ToolResult title={outputTitle}>
        <Textarea readOnly value={output} placeholder="Processed text will appear here..." className="min-h-[360px]" />
        <div className="mt-4 flex gap-3">
          <Button size="sm" variant="secondary" onClick={() => setText(output)}>
            Use output
          </Button>
        </div>
      </ToolResult>
    </div>
  );
}
