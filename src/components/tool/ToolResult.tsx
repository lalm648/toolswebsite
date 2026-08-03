import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type ToolResultProps = {
  title: string;
  isProcessing?: boolean;
  processingLabel?: string;
  children: ReactNode;
};

export default function ToolResult({
  title,
  isProcessing = false,
  processingLabel = "Updating preview",
  children,
}: ToolResultProps) {
  return (
    <Card className={`bg-[var(--surface-raised)] ${isProcessing ? "motion-shimmer" : ""}`}>
      <CardContent className="p-5 sm:p-6">
        {/*
          This used to open with a 72px decorative document icon on every tool — including
          the word counter, where a document icon preceded a word count. That was roughly
          110px of chrome above the actual payload. The heading now leads, and the
          processing state sits beside it instead of below a graphic.
        */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">{title}</h2>
          {isProcessing ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
              <span className="motion-status-dot h-2 w-2 rounded-full bg-current" />
              <span>{processingLabel}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}
