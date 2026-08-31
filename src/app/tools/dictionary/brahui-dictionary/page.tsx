import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import BrahuiDictionaryTool from "@/components/tool/BrahuiDictionaryTool";
import BrahuiWordIndex from "@/components/tool/BrahuiWordIndex";
import ToolShell from "@/components/tool/ToolShell";
import { groupByLetter, parseBrahuiEntries } from "@/lib/data/brahui-lexicon";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("brahui-dictionary");

/*
  Read at module scope so the parse happens once during the static build, not per
  request. The route is prerendered, so this file never runs in a browser and the
  words ship as HTML rather than as JavaScript.
*/
const lexiconHtml = readFileSync(
  path.join(process.cwd(), "public/brahui/index.html"),
  "utf8",
);
const wordGroups = groupByLetter(parseBrahuiEntries(lexiconHtml));

export default function BrahuiDictionaryPage() {
  return (
    <ToolShell
      eyebrow="Brahui language"
      /* Must match the registry title exactly — ToolShell looks the tool up by it. */
      title="Brahui Dictionary & Learning App"
      description="Search 3,473 Brahui words in English, romanised Brahui, or Urdu script. Read cited example sentences, hear pronunciation, and practise vocabulary in frequency order."
      afterWorkbench={<BrahuiWordIndex groups={wordGroups} />}
    >
      <BrahuiDictionaryTool />
    </ToolShell>
  );
}
