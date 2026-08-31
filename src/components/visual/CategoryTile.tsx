"use client";

/*
  The compact form of a category card. The paragraph card it replaces fit three
  categories in a viewport; this fits the whole catalogue, which is the density the
  established sites in this niche use and the reason their catalogues feel
  browsable.

  Category hue stays as wayfinding — it is not a status signal — and the brand
  gradient is reserved for actions, so nothing here uses it.
*/

import Link from "next/link";
import type { CategoryDefinition } from "@/lib/data/tools";
import {
  categoryIcons,
  categorySurfaceStyles,
  categoryTileStyles,
} from "@/lib/data/category-visuals";
import { trackCategoryOpen } from "@/lib/analytics";

type CategoryTileProps = {
  category: CategoryDefinition;
  toolCount: number;
};

export default function CategoryTile({ category, toolCount }: CategoryTileProps) {
  return (
    <Link
      href={category.href}
      data-category={category.slug}
      onClick={() => {
        trackCategoryOpen(category.slug);
      }}
      className={`group relative flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--outline-soft)] p-4 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${categorySurfaceStyles[category.slug]}`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105 ${categoryTileStyles[category.slug]}`}
      >
        {categoryIcons[category.slug]}
      </span>
      <span>
        <span className="block text-sm font-bold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
          {category.title}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
          {toolCount} {toolCount === 1 ? "tool" : "tools"}
        </span>
      </span>
    </Link>
  );
}
