import type { Metadata } from "next";
import RemoveExtraSpacesTool from "@/components/tool/RemoveExtraSpacesTool";
import ToolShell from "@/components/tool/ToolShell";
import { buildToolMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildToolMetadata("remove-extra-spaces");

export default function RemoveExtraSpacesPage() {
  return (
    <ToolShell
      eyebrow="Text cleaning"
      title="Remove Extra Spaces"
      description="Collapse repeated spaces and tabs directly in the browser to clean pasted text quickly."
    >
      <RemoveExtraSpacesTool />
    </ToolShell>
  );
}
