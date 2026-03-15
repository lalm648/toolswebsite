"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { useConsentState } from "@/lib/consent";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsentState();
  const hasConsent = consent === "accepted";

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    const queryString = searchParams.toString();
    const path = queryString ? `${pathname}?${queryString}` : pathname;
    trackPageView(path);
  }, [hasConsent, pathname, searchParams]);

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.href;

      if (!href || href.startsWith(window.location.origin)) {
        return;
      }

      trackEvent("outbound_click", {
        href,
        text: anchor.textContent?.trim().slice(0, 80),
      });
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [hasConsent]);

  return null;
}
