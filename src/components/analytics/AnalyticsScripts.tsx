"use client";

import Script from "next/script";
import { useConsentState } from "@/lib/consent";
import { adsConfig, analyticsConfig } from "@/lib/site-flags";

/**
 * Loads real analytics + ad provider scripts, but only after the visitor has
 * explicitly accepted cookies. Each provider is opt-in via environment variables,
 * so with no keys set nothing loads and nothing is tracked or served.
 */
export default function AnalyticsScripts() {
  const consent = useConsentState();

  if (consent !== "accepted") {
    return null;
  }

  return (
    <>
      {analyticsConfig.gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analyticsConfig.gaMeasurementId}', { anonymize_ip: true });
              window.gtag = gtag;
            `}
          </Script>
        </>
      ) : null}

      {analyticsConfig.plausibleDomain ? (
        <Script
          defer
          data-domain={analyticsConfig.plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}

      {adsConfig.adsenseClient ? (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.adsenseClient}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      ) : null}
    </>
  );
}
