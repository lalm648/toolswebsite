"use client";

import dynamic from "next/dynamic";
import type { ToolCategorySlug } from "@/lib/data/tools";

/**
 * The tool is the reason the page exists, so it must never render as a blank gap while
 * its chunk downloads. This skeleton mirrors the two-column workbench layout so the
 * space is reserved and nothing shifts when the real component arrives.
 */
function WorkbenchSkeleton() {
  return (
    <div
      className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading this tool</span>
      {[0, 1].map((column) => (
        <section
          key={column}
          className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6"
        >
          <div className="skeleton h-6 w-40" />
          <div className="skeleton mt-5 h-40 w-full" />
          <div className="skeleton mt-4 h-11 w-full" />
          <div className="skeleton mt-3 h-11 w-2/3" />
        </section>
      ))}
    </div>
  );
}

const ImageUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/ImageUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);
const MediaUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/MediaUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);
const DocumentUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/DocumentUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);
const DataUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/DataUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);
const GeneratorUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/GeneratorUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);
const NetworkUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/NetworkUtilityWorkbench"),
  { loading: WorkbenchSkeleton },
);

export default function ExtendedToolWorkbench({
  category,
  slug,
}: {
  category: ToolCategorySlug;
  slug: string;
}) {
  if (category === "image") return <ImageUtilityWorkbench slug={slug} />;
  if (category === "video" || category === "audio")
    return <MediaUtilityWorkbench slug={slug} />;
  if (category === "document") return <DocumentUtilityWorkbench slug={slug} />;
  if (category === "developer") return <DataUtilityWorkbench slug={slug} />;
  if (category === "security") return <GeneratorUtilityWorkbench slug={slug} />;
  if (category === "network") return <NetworkUtilityWorkbench slug={slug} />;
  return null;
}
