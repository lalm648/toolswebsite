export const siteFlags = {
  showAdSlots: process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "true",
  showSponsoredBlocks: process.env.NEXT_PUBLIC_SHOW_SPONSORED_BLOCKS === "true",
  showNewsletterSignup: process.env.NEXT_PUBLIC_SHOW_NEWSLETTER_SIGNUP !== "false",
  showWaitlistBlock: process.env.NEXT_PUBLIC_SHOW_WAITLIST_BLOCK !== "false",
};
