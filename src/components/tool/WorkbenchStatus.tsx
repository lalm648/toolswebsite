"use client";

import { Button } from "@/components/ui/button";

export function ProcessingProgress({
  active,
  progress,
  label,
  onCancel,
}: {
  active: boolean;
  progress?: number;
  label: string;
  onCancel?: () => void;
}) {
  if (!active) return null;
  const percent = progress === undefined ? undefined : Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <div className="mt-4 rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-3" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--accent-700)]">
        <span>{label}{percent === undefined ? "" : ` · ${percent}%`}</span>
        {onCancel ? <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--accent-100)]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <span className={`block h-full rounded-full bg-[var(--accent-500)] transition-[width] ${percent === undefined ? "motion-status-dot w-1/3" : ""}`} style={percent === undefined ? undefined : { width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function WorkbenchError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl border border-red-300/70 bg-red-500/10 px-4 py-3 text-sm text-[var(--error-foreground)]">
      {message}
    </p>
  );
}

export function PrivacyNotice({ serverRequired = false }: { serverRequired?: boolean }) {
  return (
    <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[var(--muted-foreground)]">
      <span className="mt-0.5 text-emerald-600" aria-hidden="true">●</span>
      {serverRequired
        ? "This diagnostic sends the destination to a protected server endpoint; your local files are never involved."
        : "Processing stays in this browser session. Nothing is uploaded by this tool."}
    </p>
  );
}
