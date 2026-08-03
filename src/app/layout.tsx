import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { buildMetadata, siteUrl } from "@/lib/seo/metadata";

/**
 * The stylesheet has always declared Plus Jakarta Sans, but nothing ever loaded it, so
 * every visitor read the site in their OS default. Next self-hosts these at build time,
 * so there is no runtime request to a font CDN.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// The font-mono utility pointed at an undefined variable, so hashes, JSON, DNS records
// and diffs were all rendering in proportional type.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = buildMetadata(
  "Free Online Tools for Images, PDF, Video & More | Webutilia",
  "Use free online tools for images, PDF, video, audio, text, code, security, SEO, and web checks. Fast browser workflows with no sign-up required.",
  { path: "/", category: "Free online tools" },
);

const siteIdentityJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Webutilia",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#logo`,
      url: `${siteUrl}/webutilia-logo.png`,
      contentUrl: `${siteUrl}/webutilia-logo.png`,
      width: 1254,
      height: 1254,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Webutilia",
    url: siteUrl,
    description: "Free browser-based tools for images, text, SEO, and developer workflows.",
    inLanguage: "en",
    publisher: { "@id": `${siteUrl}/#organization` },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteIdentityJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("theme");
                  var theme = stored === "light" || stored === "dark"
                    ? stored
                    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.dataset.theme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-[var(--action-bg)] px-4 py-3 font-semibold text-[var(--action-fg)] shadow-[var(--shadow-lift)] focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>{children}</main>
          <Footer />
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}
