import type { Metadata } from "next";
import Container from "@/components/Container";
import CategoryBrowser from "@/components/tool/CategoryBrowser";
import { getCategoryBySlug, getToolsByCategory } from "@/lib/data/tools";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Text Tools | ToolsWebsite",
  "Browse text tools for counting, cleaning, and transforming text directly in the browser."
);

export default function TextToolsPage() {
  const category = getCategoryBySlug("text");
  const tools = getToolsByCategory("text");

  if (!category) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-12">
        <CategoryBrowser category={category} tools={tools} />
      </Container>
    </section>
  );
}
