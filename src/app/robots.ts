import type { MetadataRoute } from "next";
import { isProductionIndexable, siteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: isProductionIndexable ? "/" : "",
      disallow: isProductionIndexable ? "" : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
