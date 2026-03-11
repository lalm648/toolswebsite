"use client";

import type { DragEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ToolUploaderProps = {
  title: string;
  description: string;
  buttonLabel: string;
  onButtonClick: () => void;
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
      className={`bg-[var(--surface-raised)] ${isDragActive ? "border-[var(--accent-500)] bg-[var(--surface-panel)] shadow-[var(--shadow-lift)]" : ""}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardContent className="p-10 sm:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,var(--accent-200),var(--accent-500))] text-white shadow-[var(--shadow-soft)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V6" />
              <path d="m8.5 9.5 3.5-3.5 3.5 3.5" />
              <path d="M5 18.5h14" />
            </svg>
          </div>
          <div className="px-4 py-6 text-center">
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">{title}</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
          </div>
          <Button onClick={onButtonClick} size="lg" className="min-w-36">
            {buttonLabel}
          </Button>
          {dropHint ? <p className="mt-3 text-sm text-[var(--muted-foreground)]">{dropHint}</p> : null}
          {helperText ? <p className="mt-4 text-xs text-[var(--muted-foreground)]">{helperText}</p> : null}
          {children ? <div className="mt-8 w-full">{children}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
