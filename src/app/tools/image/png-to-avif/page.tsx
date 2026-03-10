import type { Metadata } from "next";
import PngToAvifTool from "@/components/tool/PngToAvifTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "PNG to AVIF | ToolsWebsite",
  "Convert PNG images to AVIF directly in the browser with instant preview and download."
);

export default function PngToAvifPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="PNG to AVIF"
      description="Convert PNG images to AVIF with a fast browser-side workflow. Upload your file, preview the result, and download the AVIF without sending the image to a server."
    >
      <PngToAvifTool />
    </ToolShell>
  );
}
