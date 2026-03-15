import type { Metadata } from "next";
import RemoveLineBreaksTool from "@/components/tool/RemoveLineBreaksTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("remove-line-breaks");

export default function RemoveLineBreaksPage() {
  return (
    <ToolShell
      eyebrow="Text cleaning"
      title="Remove Line Breaks"
      description="Join wrapped lines into a clean paragraph directly in the browser, ideal for pasted PDF or email text."
    >
      <RemoveLineBreaksTool />
    </ToolShell>
  );
}
