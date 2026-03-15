import type { Metadata } from "next";
import WordCounterTool from "@/components/tool/WordCounterTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("word-counter");

export default function WordCounterPage() {
  return (
    <ToolShell
      eyebrow="Text utility"
      title="Word Counter"
      description="Count words, characters, lines, paragraphs, and estimated reading time directly in the browser."
    >
      <WordCounterTool />
    </ToolShell>
  );
}
