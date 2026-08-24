"use client";

import type { DragEventHandler, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
      <CardContent className="p-4 sm:p-5">
        {/*
          A real dashed drop target. The card previously accepted drops but drew no
          boundary at all — the only cue was a sentence reading "or drag and drop an
          image here". The tall icon tile and stacked text also pushed the primary
          button roughly 180px into the card.
        */}
        <div
          className={`flex flex-col items-center rounded-[var(--radius-lg)] border-2 border-dashed px-4 py-7 text-center transition-colors sm:py-9 ${
            isDragActive
              ? "border-[var(--accent-500)] bg-[var(--accent-50)]"
              : "border-[var(--outline-strong)] bg-[var(--surface-panel)]"
          }`}
        >
          <div
            className={`relative flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-100)] text-[var(--accent-700)] ${
              isDragActive || isProcessing ? "motion-float" : ""
            }`}
          >
            {isProcessing ? (
              <span className="motion-pulse-ring pointer-events-none absolute inset-0 rounded-[var(--radius-md)] border border-[var(--accent-500)]" />
            ) : null}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V6" />
              <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
              <path d="M5 18.5h14" />
            </svg>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-[var(--ink-900)]">{title}</h2>

          {fileInputId ? (
            <label htmlFor={fileInputId} className={buttonVariants({ size: "lg", className: "mt-4 min-w-40 cursor-pointer" })}>{buttonLabel}</label>
          ) : (
            <Button onClick={onButtonClick} size="lg" className="mt-4 min-w-40">
              {buttonLabel}
            </Button>
          )}

          {dropHint ? (
            <p className="mt-2.5 text-sm text-[var(--muted-foreground)]">{dropHint}</p>
          ) : null}
          {helperText ? (
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{helperText}</p>
          ) : null}

          {isProcessing ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
              <span className="motion-status-dot h-2 w-2 rounded-full bg-current" />
              <span>{processingLabel}</span>
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-center text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>

        {children ? <div className="mt-5 w-full">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
