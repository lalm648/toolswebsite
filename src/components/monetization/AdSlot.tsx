type AdSlotProps = {
  label?: string;
  placement: string;
  description?: string;
  isFilled?: boolean;
  children?: React.ReactNode;
};

export default function AdSlot({
  label = "Advertisement",
  placement,
  description = "This placement is reserved for display advertising, affiliate modules, or network-served inventory with stable layout dimensions.",
  isFilled = false,
  children,
}: AdSlotProps) {
  if (!isFilled) {
    return null;
  }

  return (
    <section
      aria-label={`${placement} ad slot`}
      className="overflow-hidden rounded-[1.55rem] border border-[var(--outline-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,246,255,0.96)_58%,rgba(255,247,251,0.94))] shadow-[var(--shadow-lift)]"
    >
      <div className="border-b border-[var(--outline-soft)] bg-[rgba(255,255,255,0.56)] px-4 py-3 backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            {placement}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="premium-pill">Reserved media</span>
            <span className="inline-flex w-fit rounded-full border border-[var(--outline-soft)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {label}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-[1.15rem] border border-dashed border-[var(--outline-strong)] bg-[linear-gradient(180deg,rgba(244,247,255,0.92),rgba(255,255,255,0.96))] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-pill">Stable layout</span>
              <span className="premium-pill">Low CLS</span>
              <span className="premium-pill">Mobile-safe</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--ink-900)]">Premium in-feed media space</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground)]">{description}</p>
            {children ? <div className="mt-4">{children}</div> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="premium-stat">
              <span className="premium-stat-label">Format</span>
              <span className="premium-stat-value">Display / affiliate</span>
            </div>
            <div className="premium-stat">
              <span className="premium-stat-label">Layout</span>
              <span className="premium-stat-value">Reserved before fill</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
