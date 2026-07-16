import type { Metadata } from "next";
import CategoryPage from "@/components/tool/CategoryPage";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("security");

export default function SecurityToolsPage() {
  return <CategoryPage slug="security" />;
}
