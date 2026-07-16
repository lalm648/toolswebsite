import type { Metadata } from "next";
import CategoryPage from "@/components/tool/CategoryPage";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("audio");

export default function AudioToolsPage() {
  return <CategoryPage slug="audio" />;
}
