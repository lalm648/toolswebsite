/*
  One section opener for the whole site: a small brand eyebrow, the section
  heading, and an optional explanatory aside that sits beside the title on wide
  screens and stacks beneath it on narrow ones.

  The eyebrow uses --accent-700 rather than the raw brand ramp: mint and
  greenyellow are surface colours and measure about 1.2:1 as text on a light
  page, so they cannot carry words.
*/

import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  id?: string;
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  aside,
  id,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-700)]">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[var(--ink-900)] sm:text-3xl"
        >
          {title}
        </h2>
      </div>
      {aside ? (
        <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)] md:text-right">
          {aside}
        </p>
      ) : null}
    </div>
  );
}
