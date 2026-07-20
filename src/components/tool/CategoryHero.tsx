import SearchBar from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryDefinition } from "@/lib/data/tools";

type CategoryHeroProps = {
  category: CategoryDefinition;
  value: string;
  onChange: (value: string) => void;
};

export default function CategoryHero({
  category,
  value,
  onChange,
}: CategoryHeroProps) {
  return (
    <Card className="relative overflow-hidden rounded-[1.5rem] border-0 bg-[var(--surface-panel)] shadow-none">
      <span className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-[var(--accent-500)]" aria-hidden="true" />
      <CardContent className="grid items-center gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{category.badge}</Badge>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">
              {category.eyebrow}
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            {category.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            {category.description}
          </p>
        </div>
        <div className="rounded-[1.2rem] bg-[var(--surface-card)] p-3">
          <p className="mb-2 px-2 text-xs font-semibold text-[var(--ink-900)]">Find the right tool</p>
          <div>
            <SearchBar
              value={value}
              onChange={onChange}
              placeholder={`Search ${category.title.toLowerCase()} by name or workflow`}
              analyticsSource={`category_${category.slug}`}
            />
          </div>
          <p className="mt-2 px-2 text-[11px] text-[var(--muted-foreground)]">Search by task, format, or result.</p>
        </div>
      </CardContent>
    </Card>
  );
}
