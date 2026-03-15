import type { Metadata } from "next";
import CaseConverterTool from "@/components/tool/CaseConverterTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("case-converter");

export default function CaseConverterPage() {
  return (
    <ToolShell
      eyebrow="Text utility"
      title="Case Converter"
      description="Convert text between uppercase, lowercase, title case, and sentence case instantly without leaving the page."
    >
      <CaseConverterTool />
    </ToolShell>
  );
}
