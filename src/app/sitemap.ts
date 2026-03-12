import type { MetadataRoute } from "next";
import { tools } from "@/lib/data/tools";
import { siteUrl } from "@/lib/seo/metadata";

const staticRoutes = [
  "/",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/tools/image",
  "/tools/text",
  "/tools/developer",
  "/tools/seo",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified,
    })),
    ...tools.map((tool) => ({
      url: `${siteUrl}${tool.href}`,
      lastModified,
    })),
  ];
}
