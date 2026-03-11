import type { Metadata } from "next";
import MetaTagGeneratorTool from "@/components/tool/MetaTagGeneratorTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Meta Tag Generator | ToolsWebsite",
  "Generate title, description, Open Graph, and Twitter meta tags directly in the browser."
);

export default function MetaTagGeneratorPage() {
  return (
    <ToolShell
      eyebrow="SEO utility"
      title="Meta Tag Generator"
      description="Generate core SEO meta tags directly in the browser, preview the output, and copy ready-to-use HTML for titles, descriptions, Open Graph, and Twitter cards."
    >
      <MetaTagGeneratorTool />
    </ToolShell>
  );
}
