import type { Metadata } from "next";
import PngToJpgTool from "@/components/tool/PngToJpgTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "PNG to JPG | ToolsWebsite",
  "Convert PNG images to JPG directly in the browser with instant preview and download."
);

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
