import type { Metadata } from "next";
import CropImageTool from "@/components/tool/CropImageTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("crop-image");

export default function CropImagePage() {
  return (
    <ToolShell
      eyebrow="Image editing"
      title="Crop Image"
      description="Crop JPG, PNG, and WebP images directly in the browser. Choose the crop area, preview the result live, and download the cropped image without uploading it anywhere."
    >
      <CropImageTool />
    </ToolShell>
  );
}
