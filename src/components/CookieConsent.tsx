"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { setConsentState, useConsentState } from "@/lib/consent";

export default function CookieConsent() {
  const consent = useConsentState();

  if (consent !== "unset") {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-[1.4rem] border border-[var(--outline-strong)] bg-[var(--surface-raised)] shadow-[var(--shadow-lift)] backdrop-blur">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--ink-900)]">Privacy and measurement</p>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            ToolsWebsite uses privacy-conscious analytics to understand page views, searches, and tool
            usage. You can accept or decline non-essential tracking. See the{" "}
            <Link href="/privacy-policy" className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]">
              privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setConsentState("declined")}>
            Decline
          </Button>
          <Button type="button" onClick={() => setConsentState("accepted")}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
