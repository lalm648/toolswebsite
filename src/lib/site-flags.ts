export const siteFlags = {
  showAdSlots: process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "true",
  showSponsoredBlocks: process.env.NEXT_PUBLIC_SHOW_SPONSORED_BLOCKS === "true",
  showNewsletterSignup: process.env.NEXT_PUBLIC_SHOW_NEWSLETTER_SIGNUP !== "false",
  showWaitlistBlock: process.env.NEXT_PUBLIC_SHOW_WAITLIST_BLOCK !== "false",
};

export const analyticsConfig = {
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",
};

export const adsConfig = {
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  inContentSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT ?? "",
};

export const hasAnalyticsProvider = Boolean(
  analyticsConfig.gaMeasurementId || analyticsConfig.plausibleDomain
);

export const hasAdsenseConfigured = Boolean(adsConfig.adsenseClient);
