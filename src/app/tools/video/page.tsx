import type { Metadata } from "next";
import CategoryPage from "@/components/tool/CategoryPage";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("video");

export default function VideoToolsPage() {
  return <CategoryPage slug="video" />;
}
