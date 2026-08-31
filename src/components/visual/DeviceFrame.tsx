/*
  Browser chrome around a live preview. The chrome is scenery: it is hidden from
  assistive technology and contains no interactive element, because a fake address
  bar that looked clickable would be a usability trap. Whatever is framed inside
  remains fully real and fully accessible.
*/

import type { ReactNode } from "react";

type DeviceFrameProps = {
  url?: string;
  children: ReactNode;
  className?: string;
};

export default function DeviceFrame({
  url = "webutilia.com",
  children,
  className = "",
}: DeviceFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-lift)] ${className}`}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-1.5 border-b border-[var(--outline-soft)] bg-[var(--surface-panel)] px-4 py-2.5"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="h-2 w-2 rounded-full bg-[var(--outline-strong)]" />
        <span className="ml-3 font-mono text-[11px] text-[var(--muted-foreground)]">{url}</span>
      </div>
      {children}
    </div>
  );
}
