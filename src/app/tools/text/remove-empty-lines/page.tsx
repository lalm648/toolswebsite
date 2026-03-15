import type { Metadata } from "next";
import RemoveEmptyLinesTool from "@/components/tool/RemoveEmptyLinesTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("remove-empty-lines");

export default function RemoveEmptyLinesPage() {
  return (
    <ToolShell
      eyebrow="Text cleaning"
      title="Remove Empty Lines"
      description="Delete empty lines from pasted text directly in the browser while keeping the rest of the content intact."
    >
      <RemoveEmptyLinesTool />
    </ToolShell>
  );
}
