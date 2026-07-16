import type { Metadata } from "next";
import CategoryPage from "@/components/tool/CategoryPage";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("document");

export default function DocumentToolsPage() {
  return <CategoryPage slug="document" />;
}
