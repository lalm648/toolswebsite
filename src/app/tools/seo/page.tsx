import type { Metadata } from "next";
import Container from "@/components/Container";
import CategoryBrowser from "@/components/tool/CategoryBrowser";
import { getCategoryBySlug, getToolsByCategory } from "@/lib/data/tools";
import { buildCategoryMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildCategoryMetadata("seo");

export default function SeoToolsPage() {
  const category = getCategoryBySlug("seo");
  const tools = getToolsByCategory("seo");

  if (!category) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <CategoryBrowser category={category} tools={tools} />
      </Container>
    </section>
  );
}
