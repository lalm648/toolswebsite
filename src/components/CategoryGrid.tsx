"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { tools, type CategoryDefinition } from "@/lib/data/tools";
import { trackCategoryOpen } from "@/lib/analytics";
import {
  categoryIcons,
  categorySurfaceStyles,
  categoryTileStyles,
} from "@/lib/data/category-visuals";

type CategoryGridProps = {
  categories: CategoryDefinition[];
};

const MotionLink = motion.create(Link);

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const toolCount = tools.filter((tool) => tool.category === category.slug).length;
        return (
        <MotionLink
          key={category.slug}
          href={category.href}
          data-category={category.slug}
          onClick={() => {
            trackCategoryOpen(category.slug);
          }}
          whileHover={reduceMotion ? undefined : { y: -6, scale: 1.01 }}
          whileTap={reduceMotion ? undefined : { y: -1, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.55 }}
          className={`soft-3d-card category-card-interactive group flex min-h-40 items-start gap-3.5 rounded-[var(--radius-md)] border border-transparent p-4 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${categorySurfaceStyles[category.slug]}`}
        >
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 transition-all duration-200 group-hover:scale-105 ${categoryTileStyles[category.slug]}`}
          >
            {categoryIcons[category.slug]}
          </span>
          <div className="flex min-h-32 min-w-0 flex-1 flex-col">
            <h3 className="text-[16px] font-bold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
              {category.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--muted-foreground)]">
              {category.description}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-bold text-[var(--ink-900)]">
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </span>
          </div>
        </MotionLink>
        );
      })}
    </div>
  );
}
