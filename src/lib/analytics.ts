"use client";

import { hasTrackingConsent } from "@/lib/consent";

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: { props?: AnalyticsPayload }) => void;
  }
}

function sanitizePayload(payload: AnalyticsPayload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasTrackingConsent()) {
    return;
  }

  const sanitizedPayload = sanitizePayload(payload);

  window.dataLayer?.push({
    event: eventName,
    ...sanitizedPayload,
  });

  window.gtag?.("event", eventName, sanitizedPayload);
  window.plausible?.(eventName, { props: sanitizedPayload });

  window.dispatchEvent(
    new CustomEvent("toolswebsite:analytics", {
      detail: {
        event: eventName,
        payload: sanitizedPayload,
      },
    })
  );
}

export function trackPageView(path: string) {
  trackEvent("page_view", { path });
}

export function trackSearch(query: string, source: string) {
  trackEvent("search", {
    query,
    source,
  });
}

export function trackToolOpen(toolSlug: string, category: string) {
  trackEvent("tool_open", {
    tool_slug: toolSlug,
    category,
  });
}

export function trackCategoryOpen(categorySlug: string) {
  trackEvent("category_open", {
    category_slug: categorySlug,
  });
}

export function trackCtaClick(label: string, href: string, location: string) {
  trackEvent("cta_click", {
    label,
    href,
    location,
  });
}

export function trackToolFailure(toolSlug: string, action: string, reason: string, payload: AnalyticsPayload = {}) {
  trackEvent("tool_action_failed", {
    tool_slug: toolSlug,
    action,
    reason,
    ...payload,
  });
}
