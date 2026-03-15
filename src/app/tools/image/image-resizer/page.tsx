import type { Metadata } from "next";
import ImageResizerTool from "@/components/tool/ImageResizerTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("image-resizer");

export default function ImageResizerPage() {
  return (
    <ToolShell
      eyebrow="Image sizing"
      title="Image Resizer"
      description="Resize JPG, PNG, and WebP images in the browser. Keep the aspect ratio locked by default, adjust dimensions, preview the result, and download the resized file without uploading it anywhere."
    >
      <ImageResizerTool />
    </ToolShell>
  );
}
