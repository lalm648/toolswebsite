"use client";

import { useSyncExternalStore } from "react";

export type ConsentState = "accepted" | "declined" | "unset";

export const CONSENT_STORAGE_KEY = "toolswebsite-cookie-consent";

export function getConsentState(): ConsentState {
  if (typeof window === "undefined") {
    return "unset";
  }

  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);

  if (value === "accepted" || value === "declined") {
    return value;
  }

  return "unset";
}

export function setConsentState(state: Exclude<ConsentState, "unset">) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  window.dispatchEvent(
    new CustomEvent("toolswebsite:consent-change", {
      detail: { state },
    })
  );
}

export function hasTrackingConsent() {
  return getConsentState() === "accepted";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleConsentChange() {
    onStoreChange();
  }

  window.addEventListener("toolswebsite:consent-change", handleConsentChange);

  return () => {
    window.removeEventListener("toolswebsite:consent-change", handleConsentChange);
  };
}

export function useConsentState() {
  return useSyncExternalStore(subscribe, getConsentState, () => "unset");
}
