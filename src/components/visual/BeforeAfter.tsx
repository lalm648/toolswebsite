/*
  Side-by-side proof that a tool did something. Every tool already knows how to
  format its own measurements, so this takes display strings rather than raw
  numbers — duplicating byte formatting here would mean two places to get it wrong.

  `children` is the optional visual comparison (an image pair, a waveform); the
  numeric summary stands on its own when a tool has nothing to show.
*/

import type { ReactNode } from "react";
import ResultMeter from "@/components/visual/ResultMeter";

type BeforeAfterProps = {
  beforeLabel: string;
  afterLabel: string;
  beforeValue: string;
  afterValue: string;
  ratio?: number;
  children?: ReactNode;
  className?: string;
};

export default function BeforeAfter({
  beforeLabel,
  afterLabel,
  beforeValue,
  afterValue,
  ratio,
  children,
  className = "",
}: BeforeAfterProps) {
  return (
    <div className={className}>
      {children ? <div className="mb-3">{children}</div> : null}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-sm)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {beforeLabel}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold text-[var(--ink-900)]">
            {beforeValue}
          </p>
          <ResultMeter className="mt-2" value={1} max={1} label={`${beforeLabel} baseline`} />
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--accent-200)] bg-[var(--accent-50)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {afterLabel}
          </p>
          <p className="mt-1.5 font-mono text-lg font-semibold text-[var(--accent-700)]">
            {afterValue}
          </p>
          {typeof ratio === "number" ? (
            <ResultMeter className="mt-2" value={ratio} max={1} label={`${afterLabel} relative to ${beforeLabel}`} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
