"use client";

import { resetConsentState } from "@/lib/consent";

type CookieSettingsButtonProps = {
  className?: string;
};

export default function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  return (
    <button type="button" onClick={() => resetConsentState()} className={className}>
      Cookie settings
    </button>
  );
}
