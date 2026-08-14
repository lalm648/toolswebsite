import type { Metadata } from "next";
import CategoryPage from "@/components/tool/CategoryPage";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("dictionary");

export default function DictionaryToolsPage() {
  return <CategoryPage slug="dictionary" />;
}
