import Container from "@/components/Container";
import CategoryBrowser from "@/components/tool/CategoryBrowser";
import { getCategoryBySlug, getToolsByCategory, type ToolCategorySlug } from "@/lib/data/tools";

type CategoryPageProps = {
  slug: ToolCategorySlug;
};

export default function CategoryPage({ slug }: CategoryPageProps) {
  const category = getCategoryBySlug(slug);

  if (!category) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-12">
        <CategoryBrowser category={category} tools={getToolsByCategory(slug)} />
      </Container>
    </section>
  );
}
