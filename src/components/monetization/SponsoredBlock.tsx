"use client";

import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics";

type SponsoredBlockProps = {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  label: string;
  isLive?: boolean;
};

export default function SponsoredBlock({
  eyebrow = "Sponsored",
  title,
  description,
  href,
  label,
  isLive = false,
}: SponsoredBlockProps) {
  if (!isLive) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[var(--outline-soft)] bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(243,247,255,0.98)_52%,rgba(252,241,248,0.96))] shadow-[var(--shadow-lift)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline-soft)] bg-[rgba(255,255,255,0.58)] px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{eyebrow}</p>
          <span className="inline-flex h-2 w-2 rounded-full bg-[var(--brand-500)]" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="premium-pill">Disclosed placement</span>
          <span className="rounded-full bg-[var(--accent-50)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-700)]">
            Partner content
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="premium-pill">Partner workflow</span>
              <span className="premium-pill">Context-matched</span>
              <span className="premium-pill">Conversion-safe</span>
            </div>
            <div className="max-w-2xl">
              <h2 className="text-[1.45rem] font-semibold tracking-tight text-[var(--ink-900)] sm:text-[1.65rem]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="premium-stat">
                <span className="premium-stat-label">Placement style</span>
                <span className="premium-stat-value">Native card</span>
              </div>
              <div className="premium-stat">
                <span className="premium-stat-label">Best use</span>
                <span className="premium-stat-value">Affiliate or sponsor</span>
              </div>
              <div className="premium-stat">
                <span className="premium-stat-label">UX rule</span>
                <span className="premium-stat-value">Useful before commercial</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--outline-soft)] bg-[rgba(255,255,255,0.8)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm">
            <div className="rounded-[1rem] border border-[var(--outline-soft)] bg-[linear-gradient(180deg,rgba(236,242,255,0.92),rgba(255,244,250,0.9))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Recommended next step</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink-900)]">Keep the commercial message aligned with the user’s current task.</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                This block works best for a trusted partner, premium workflow, or relevant affiliate offer that feels like an upgrade, not a distraction.
              </p>
            </div>

            <Link
              href={href}
              onClick={() => trackCtaClick(label, href, "sponsored_block")}
              className="premium-action mt-4"
            >
              <span>{label}</span>
              <span aria-hidden="true">→</span>
            </Link>

            <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
              Clear disclosure keeps trust intact while preserving a premium editorial look.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
