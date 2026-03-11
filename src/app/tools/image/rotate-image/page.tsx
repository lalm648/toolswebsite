import type { Metadata } from "next";
import RotateImageTool from "@/components/tool/RotateImageTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Rotate Image | ToolsWebsite",
  "Rotate JPG, PNG, and WebP images directly in the browser with preview and instant download."
);

export default function RotateImagePage() {
  return (
    <ToolShell
      eyebrow="Image editing"
      title="Rotate Image"
      description="Rotate JPG, PNG, and WebP images directly in the browser. Choose the angle, preview the result, and download the rotated image without uploading it anywhere."
    >
      <RotateImageTool />
    </ToolShell>
  );
}
