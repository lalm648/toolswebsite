import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Short links resolve from the visitor's own browser storage, so every /s/{code} URL is
 * unique, unbounded, and meaningless to a search engine. The client page below cannot
 * export metadata itself, so without this layout each one inherited the site-wide
 * defaults — including a canonical pointing at the home page.
 *
 * This is deliberately a noindex meta rather than a robots.txt block: crawling has to
 * stay allowed for Google to see the directive and drop anything already indexed.
 */
export const metadata: Metadata = {
  title: "Short link",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: {},
};

export default function ShortLinkLayout({ children }: { children: ReactNode }) {
  return children;
}
