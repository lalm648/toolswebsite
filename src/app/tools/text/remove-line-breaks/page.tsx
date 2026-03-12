import type { Metadata } from "next";
import RemoveLineBreaksTool from "@/components/tool/RemoveLineBreaksTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Remove Line Breaks | ToolsWebsite",
  "Remove line breaks from text directly in the browser."
);

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
