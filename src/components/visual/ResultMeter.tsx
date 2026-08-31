/*
  A single bar showing how much of a budget a result used — bytes saved, quality
  retained, compression achieved. The fill carries the brand gradient, which is the
  one place neon is unambiguously a surface rather than text.

  The ratio is clamped rather than trusted: callers pass real measurements, and a
  compressed file that grew would otherwise render a bar wider than its track.
*/

type ResultMeterProps = {
  value: number;
  max?: number;
  label: string;
  className?: string;
};

export default function ResultMeter({
  value,
  max = 100,
  label,
  className = "",
}: ResultMeterProps) {
  const safeMax = max > 0 ? max : 1;
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-panel)] ${className}`}
    >
      <div
        style={{ width: `${ratio * 100}%`, background: "var(--brand-gradient)" }}
        className="h-full rounded-full"
      />
    </div>
  );
}
