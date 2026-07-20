import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Webutilia",
    short_name: "Webutilia",
    description:
      "Browser tools for media, documents, code, security, SEO, and web workflows.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#047857",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/webutilia-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
