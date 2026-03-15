import type { Metadata } from "next";
import MetaTagGeneratorTool from "@/components/tool/MetaTagGeneratorTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("meta-tag-generator");

export default function MetaTagGeneratorPage() {
  return (
    <ToolShell
      eyebrow="SEO utility"
      title="Meta Tag Generator"
      description="Generate stronger SEO meta tags directly in the browser, preview search and social cards, and prepare Open Graph and Twitter image tags with dimensions and alt text."
    >
      <MetaTagGeneratorTool />
    </ToolShell>
  );
}
