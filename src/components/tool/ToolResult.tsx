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
      <CardContent className="p-6 sm:p-7">
        <div className="text-center">
          <div
            className={`mx-auto flex h-18 w-18 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--accent-200),var(--accent-500))] text-white shadow-[var(--shadow-soft)] ${
              isProcessing ? "motion-float" : ""
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <path d="M8 10.5h8" />
              <path d="M8 14.5h5" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--ink-900)]">{title}</h2>
          {isProcessing ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
              <span className="h-2 w-2 rounded-full bg-current motion-status-dot" />
              <span>{processingLabel}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}
