import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ToolsWebsite",
    short_name: "Tools",
    description: "Private browser tools for image, text, developer, and SEO workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
