import type { MetadataRoute } from "next";
import { categories, tools } from "@/lib/data/tools";
import { siteUrl } from "@/lib/seo/metadata";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredLastModified = process.env.NEXT_PUBLIC_SITE_UPDATED_AT;
  const lastModified = configuredLastModified ? new Date(configuredLastModified) : undefined;

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}${category.href}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}${tool.href}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
