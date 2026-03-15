import type { Metadata } from "next";
import PngToJpgTool from "@/components/tool/PngToJpgTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("png-to-jpg");

export default function PngToJpgPage() {
  return (
    <ToolShell
      eyebrow="Image converter"
      title="PNG to JPG"
      description="Convert PNG images to JPG with a fast browser-side workflow. Upload your file, preview the result, and download the JPG without sending the image to a server."
    >
      <PngToJpgTool />
    </ToolShell>
  );
}
