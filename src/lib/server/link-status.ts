export type LinkCheckState = "working" | "broken" | "unverified";

/**
 * A link is only broken when the destination explicitly confirms that the
 * resource is gone. Access controls, rate limits, and server failures do not
 * prove that a public link is broken.
 */
export function classifyLinkStatus(status: number): LinkCheckState {
  if (status >= 200 && status < 400) return "working";
  if (status === 404 || status === 410) return "broken";
  return "unverified";
}
