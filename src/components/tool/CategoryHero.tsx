import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryDefinition } from "@/lib/data/tools";

type CategoryHeroProps = {
  category: CategoryDefinition;
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryHero({ category, value, onChange }: CategoryHeroProps) {
  return (
    <Card className="rounded-[2rem] bg-[var(--surface-hero)]">
      <CardContent className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{category.badge}</Badge>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent-600)]">
            {category.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-6xl">
            {category.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
            {category.description}
          </p>
          <div className="mt-8">
            <SearchBar
              value={value}
              onChange={onChange}
              placeholder={`Search ${category.title.toLowerCase()} like JPG to PNG or Image Resizer`}
              analyticsSource={`category_${category.slug}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
