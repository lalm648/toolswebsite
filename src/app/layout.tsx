import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Free Online Tools for Images, PDF, Video & More | ToolsWebsite",
  "Use free online tools for images, PDF, video, audio, text, code, security, SEO, and web checks. Fast browser workflows with no sign-up required.",
  { path: "/", category: "Free online tools" },
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
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
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}
