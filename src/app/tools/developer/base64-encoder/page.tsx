import type { Metadata } from "next";
import Base64EncoderTool from "@/components/tool/Base64EncoderTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("base64-encoder");

export default function Base64EncoderPage() {
  return (
    <ToolShell
      eyebrow="Developer utility"
      title="Base64 Encoder"
      description="Encode text to Base64 or decode Base64 back to readable text directly in the browser."
    >
      <Base64EncoderTool />
    </ToolShell>
  );
}
