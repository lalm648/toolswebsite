import type { Metadata } from "next";
import PngToWebpTool from "@/components/tool/PngToWebpTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "PNG to WebP | ToolsWebsite",
  "Convert PNG images to WebP directly in the browser with instant preview and download."
);

export default function PngToWebpPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="PNG to WebP"
      description="Convert PNG images to WebP with a fast browser-side workflow. Upload your file, preview the result, and download the WebP without sending the image to a server."
    >
      <PngToWebpTool />
    </ToolShell>
  );
}
