import type { Metadata } from "next";
import PngToAvifTool from "@/components/tool/PngToAvifTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("png-to-avif");

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
