import type { Metadata } from "next";
import ImageCompressorTool from "@/components/tool/ImageCompressorTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Image Compressor | ToolsWebsite",
  "Compress JPG, PNG, and WebP images directly in the browser with quality and resize controls."
);

export default function ImageCompressorPage() {
  return (
    <ToolShell
      eyebrow="Image optimizer"
      title="Image Compressor"
      description="Reduce image file size with browser-side compression. Adjust quality, limit dimensions, choose the output format, preview the result, and download the optimized image without sending it to a server."
    >
      <ImageCompressorTool />
    </ToolShell>
  );
}
