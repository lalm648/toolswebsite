"use client";

import dynamic from "next/dynamic";
import type { ToolCategorySlug } from "@/lib/data/tools";

const ImageUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/ImageUtilityWorkbench"),
);
const MediaUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/MediaUtilityWorkbench"),
);
const DocumentUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/DocumentUtilityWorkbench"),
);
const DataUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/DataUtilityWorkbench"),
);
const GeneratorUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/GeneratorUtilityWorkbench"),
);
const NetworkUtilityWorkbench = dynamic(
  () => import("@/components/tool/extended/NetworkUtilityWorkbench"),
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
