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
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--outline-strong)] bg-[var(--surface-raised)] shadow-[var(--shadow-lift)] backdrop-blur sm:inset-x-4 sm:bottom-4">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--ink-900)]">Privacy and measurement</p>
            <span className="rounded-full bg-[var(--accent-50)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent-700)]">
              Optional
            </span>
          </div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
            Analytics helps improve searches and tool workflows. Declining does not limit any tool. See the{" "}
            <Link href="/privacy-policy" className="font-medium text-[var(--accent-700)] hover:text-[var(--brand-700)]">
              privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setConsentState("declined")}>
            Decline
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={() => setConsentState("accepted")}>
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
