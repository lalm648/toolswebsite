import type { Metadata } from "next";
import JpgToAvifTool from "@/components/tool/JpgToAvifTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "JPG to AVIF | ToolsWebsite",
  "Convert JPG images to AVIF directly in the browser with instant preview and download."
);

export default function JpgToAvifPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="JPG to AVIF"
      description="Convert JPG images to AVIF with a fast browser-side workflow. Upload your file, preview the result, and download the AVIF without sending the image to a server."
    >
      <JpgToAvifTool />
    </ToolShell>
  );
}
