import type { Metadata } from "next";
import JpgToWebpTool from "@/components/tool/JpgToWebpTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "JPG to WebP | ToolsWebsite",
  "Convert JPG images to WebP directly in the browser with instant preview and download."
);

export default function JpgToWebpPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="JPG to WebP"
      description="Convert JPG images to WebP with a fast browser-side workflow. Upload your file, preview the result, and download the WebP without sending the image to a server."
    >
      <JpgToWebpTool />
    </ToolShell>
  );
}
