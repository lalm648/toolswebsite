import type { Metadata } from "next";
import RemoveDuplicateLinesTool from "@/components/tool/RemoveDuplicateLinesTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("remove-duplicate-lines");

export default function RemoveDuplicateLinesPage() {
  return (
    <ToolShell
      eyebrow="Text cleaning"
      title="Remove Duplicate Lines"
      description="Remove repeated lines from lists and copied text directly in the browser while preserving the first occurrence."
    >
      <RemoveDuplicateLinesTool />
    </ToolShell>
  );
}
