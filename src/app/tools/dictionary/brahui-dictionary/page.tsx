import type { Metadata } from "next";
import BrahuiDictionaryTool from "@/components/tool/BrahuiDictionaryTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("brahui-dictionary");

export default function BrahuiDictionaryPage() {
  return (
    <ToolShell
      eyebrow="Brahui language"
      /* Must match the registry title exactly — ToolShell looks the tool up by it. */
      title="Brahui Dictionary & Learning App"
      description="Search 3,473 Brahui words in English, romanised Brahui, or Urdu script. Read cited example sentences, hear pronunciation, and practise vocabulary in frequency order."
    >
      <BrahuiDictionaryTool />
    </ToolShell>
  );
}
