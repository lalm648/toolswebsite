import type { Metadata } from "next";
import JsonFormatterTool from "@/components/tool/JsonFormatterTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "JSON Formatter | ToolsWebsite",
  "Format and minify JSON directly in the browser with validation feedback."
);

export default function JsonFormatterPage() {
  return (
    <ToolShell
      eyebrow="Developer utility"
      title="JSON Formatter"
      description="Format and minify JSON directly in the browser. Paste your payload, validate it, and get clean structured output instantly."
    >
      <JsonFormatterTool />
    </ToolShell>
  );
}
