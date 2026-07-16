import type { MetadataRoute } from "next";
import { tools } from "@/lib/data/tools";
import { siteUrl } from "@/lib/seo/metadata";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/tools/image", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools/text", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools/developer", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools/seo", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}${tool.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
