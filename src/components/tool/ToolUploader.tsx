"use client";

import type { DragEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ToolUploaderProps = {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
  fileInputId?: string;
  isProcessing?: boolean;
  processingLabel?: string;
  helperText?: string;
  dropHint?: string;
  isDragActive?: boolean;
  onDragEnter?: DragEventHandler<HTMLDivElement>;
  onDragLeave?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
  children?: ReactNode;
};

export default function ToolUploader({
  title,
  description,
  buttonLabel,
  onButtonClick,
  fileInputId,
  isProcessing = false,
  processingLabel = "Processing",
  helperText,
  dropHint,
  isDragActive = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  children,
}: ToolUploaderProps) {
  return (
    <Card
      className={`bg-[var(--surface-raised)] ${
        isDragActive || isProcessing ? "border-[var(--accent-500)] bg-[var(--surface-panel)] shadow-[var(--shadow-lift)]" : ""
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div
            className={`relative flex h-18 w-18 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--accent-200),var(--accent-500))] text-white shadow-[var(--shadow-soft)] ${
              isDragActive || isProcessing ? "motion-float" : ""
            }`}
          >
            {isProcessing ? (
              <>
                <span className="pointer-events-none absolute inset-0 rounded-[1.4rem] border border-white/30 motion-pulse-ring" />
                <span className="pointer-events-none absolute inset-0 rounded-[1.4rem] border border-white/20 motion-pulse-ring [animation-delay:240ms]" />
              </>
            ) : null}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V6" />
              <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
              <path d="M5 18.5h14" />
            </svg>
          </div>
          <div className="px-2 py-4 text-center">
            <h2 className="text-lg font-semibold text-[var(--ink-900)]">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
          </div>
          {isProcessing ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
              <span className="h-2 w-2 rounded-full bg-current motion-status-dot" />
              <span>{processingLabel}</span>
            </div>
          ) : null}
          {fileInputId ? (
            <Button asChild size="lg" className="mt-4 min-w-36">
              <label htmlFor={fileInputId} className="cursor-pointer">
                {buttonLabel}
              </label>
            </Button>
          ) : (
            <Button onClick={onButtonClick} size="lg" className="mt-4 min-w-36">
              {buttonLabel}
            </Button>
          )}
          {dropHint ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">{dropHint}</p> : null}
          {helperText ? <p className="mt-3 text-xs text-[var(--muted-foreground)]">{helperText}</p> : null}
          {children ? <div className="mt-6 w-full">{children}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
