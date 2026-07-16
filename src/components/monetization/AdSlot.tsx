"use client";

import { useEffect, useRef } from "react";
import { useConsentState } from "@/lib/consent";
import { adsConfig } from "@/lib/site-flags";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdSlotProps = {
  /** AdSense ad-unit slot id. Falls back to the shared in-content slot from env. */
  slot?: string;
  placement: string;
  className?: string;
};

/**
 * Renders a real Google AdSense in-content unit when AdSense is configured
 * (NEXT_PUBLIC_ADSENSE_CLIENT + a slot id) and the visitor has accepted cookies.
 * With no ad config or without consent it renders nothing, so the layout stays
 * clean and no ad requests fire until the site is genuinely monetized.
 */
export default function AdSlot({ slot, placement, className }: AdSlotProps) {
  const consent = useConsentState();
  const pushedRef = useRef(false);
  const resolvedSlot = slot || adsConfig.inContentSlot;
  const canServe = Boolean(adsConfig.adsenseClient && resolvedSlot) && consent === "accepted";

  useEffect(() => {
    if (!canServe || pushedRef.current) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // adsbygoogle script not ready yet; it will retry on the next mount.
    }
  }, [canServe]);

  if (!canServe) {
    return null;
  }

  return (
    <section aria-label={`${placement} advertisement`} className={className}>
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={adsConfig.adsenseClient}
        data-ad-slot={resolvedSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}
