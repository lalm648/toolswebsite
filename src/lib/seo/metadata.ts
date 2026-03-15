import type { Metadata } from "next";
import { getCategoryBySlug, tools } from "@/lib/data/tools";
import { categorySeoContent, toolSeoContent } from "@/lib/seo/content";

type MetadataOptions = {
  path?: string;
  keywords?: string[];
  category?: string;
  type?: "website" | "article";
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  return configuredUrl.endsWith("/") ? configuredUrl.slice(0, -1) : configuredUrl;
}

export const siteUrl = getSiteUrl();
const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim() || undefined;
const authorName = "ToolsWebsite";
const netlifyContext = process.env.CONTEXT?.trim();
const vercelEnv = process.env.VERCEL_ENV?.trim();

export const isProductionIndexable =
  (process.env.NETLIFY === "true" ? netlifyContext === "production" : true) &&
  (vercelEnv ? vercelEnv === "production" : true);

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
      index: isProductionIndexable,
      follow: isProductionIndexable,
      googleBot: {
        index: isProductionIndexable,
        follow: isProductionIndexable,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: options?.category,
    keywords: options?.keywords,
    authors: [{ name: authorName }],
    creator: authorName,
    publisher: authorName,
    applicationName: "ToolsWebsite",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title,
      description,
      type: options?.type ?? "website",
      url,
      siteName: "ToolsWebsite",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: twitterHandle,
      creator: twitterHandle,
    },
  };
}

export function buildToolMetadata(slug: string): Metadata {
  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return buildMetadata("ToolsWebsite", "Free browser-based tools for images, text, SEO, and developer workflows.");
  }

  const seoContent = toolSeoContent[slug];

  return buildMetadata(`${tool.title} | ToolsWebsite`, tool.description, {
    path: tool.href,
    category: getCategoryBySlug(tool.category)?.title,
    keywords: seoContent?.keywords ?? [tool.title, tool.meta, `${tool.title} online`],
  });
}

export function buildCategoryMetadata(slug: Parameters<typeof getCategoryBySlug>[0]): Metadata {
  const category = getCategoryBySlug(slug);

  if (!category) {
    return buildMetadata("ToolsWebsite", "Free browser-based tools for images, text, SEO, and developer workflows.");
  }

  return buildMetadata(`${category.title} | ToolsWebsite`, category.description, {
    path: category.href,
    category: category.title,
    keywords: categorySeoContent[slug]?.keywords ?? [category.title, `${category.title} online`, "browser tools"],
  });
}
