"use client";

import Link from "next/link";
import type { CategoryDefinition } from "@/lib/data/tools";
import { trackCategoryOpen } from "@/lib/analytics";

type CategoryGridProps = {
  categories: CategoryDefinition[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={category.href}
          onClick={() => {
            trackCategoryOpen(category.slug);
          }}
          className="group block rounded-[1.8rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-7 shadow-[var(--shadow-soft)] backdrop-blur hover:-translate-y-1 hover:border-[var(--outline-strong)] hover:shadow-[var(--shadow-lift)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-700)]">
            {category.slug}
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--ink-900)] group-hover:text-[var(--brand-700)]">
            {category.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{category.description}</p>
        </Link>
      ))}
    </div>
  );
}
