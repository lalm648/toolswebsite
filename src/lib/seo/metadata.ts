import type { Metadata } from "next";

type MetadataOptions = {
  path?: string;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  return configuredUrl.endsWith("/") ? configuredUrl.slice(0, -1) : configuredUrl;
}

export const siteUrl = getSiteUrl();

export function buildMetadata(title: string, description: string, options?: MetadataOptions): Metadata {
  const url = options?.path ? `${siteUrl}${options.path}` : siteUrl;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "ToolsWebsite",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
