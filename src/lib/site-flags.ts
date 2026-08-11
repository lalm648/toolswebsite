export const siteFlags = {
  showAdSlots: process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "true",
  showSponsoredBlocks: process.env.NEXT_PUBLIC_SHOW_SPONSORED_BLOCKS === "true",
  showNewsletterSignup: process.env.NEXT_PUBLIC_SHOW_NEWSLETTER_SIGNUP !== "false",
  showWaitlistBlock: process.env.NEXT_PUBLIC_SHOW_WAITLIST_BLOCK !== "false",
};

export const analyticsConfig = {
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",
  // Ahrefs Web Analytics is cookieless and stores nothing on the device, so unlike the
  // consent-gated providers it loads in <head> on every page. The key is a public
  // site identifier, not a secret; the env var only exists so staging can override it.
  ahrefsKey: process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY ?? "LNv+epc1LqzO0d/d5sbF8A",
};

export const adsConfig = {
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  inContentSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT ?? "",
};

export const hasAnalyticsProvider = Boolean(
  analyticsConfig.gaMeasurementId || analyticsConfig.plausibleDomain
);

export const hasAdsenseConfigured = Boolean(adsConfig.adsenseClient);
