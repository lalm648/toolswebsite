import type { Metadata } from "next";
import JpgToWebpTool from "@/components/tool/JpgToWebpTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("jpg-to-webp");

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
