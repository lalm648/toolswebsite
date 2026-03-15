import type { Metadata } from "next";
import JpgToPngTool from "@/components/tool/JpgToPngTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("jpg-to-png");

export default function JpgToPngPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="JPG to PNG"
      description="Convert JPEG images to PNG with a fast browser-side workflow. Upload your file, preview the result, and download the PNG without sending the image to a server."
    >
      <JpgToPngTool />
    </ToolShell>
  );
}
