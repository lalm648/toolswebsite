"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { CategoryDefinition, ToolCategorySlug } from "@/lib/data/tools";
import { trackCategoryOpen } from "@/lib/analytics";

type CategoryGridProps = {
  categories: CategoryDefinition[];
};

const iconProps = {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  className: "h-full w-full",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const categoryIcons: Record<ToolCategorySlug, ReactNode> = {
  image: (
    <svg {...iconProps}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-4.5L14 17" />
      <path d="m13 15 2.5-2.5L20 17" />
    </svg>
  ),
  video: (
    <svg {...iconProps}>
      <rect x="4" y="6" width="12" height="12" rx="2.5" />
      <path d="m16 10 4-2v8l-4-2" />
      <path d="m9 10 3 2-3 2Z" />
    </svg>
  ),
  audio: (
    <svg {...iconProps}>
      <path d="M9 18V7l9-2v11" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="15.5" cy="16" r="2.5" />
    </svg>
  ),
  document: (
    <svg {...iconProps}>
      <path d="M7 3.5h7l4 4V20H7Z" />
      <path d="M14 3.5V8h4" />
      <path d="M10 12h5M10 15h5" />
    </svg>
  ),
  text: (
    <svg {...iconProps}>
      <path d="M6 6h12" />
      <path d="M12 6v12" />
      <path d="M9.5 18h5" />
    </svg>
  ),
  developer: (
    <svg {...iconProps}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 6-3 12" />
    </svg>
  ),
  security: (
    <svg {...iconProps}>
      <path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.5-7 9-4.2-1.5-7-4.8-7-9V6Z" />
      <path d="m9.2 12 1.8 1.8 3.8-4" />
    </svg>
  ),
  network: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5S14.2 18.2 12 20.5C9.8 18.2 8.7 15.4 8.7 12S9.8 5.8 12 3.5Z" />
    </svg>
  ),
  seo: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  ),
};

const categoryTileStyles: Record<ToolCategorySlug, string> = {
  image: "bg-blue-500/12 text-blue-500 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20",
  video: "bg-violet-500/12 text-violet-500 ring-1 ring-violet-500/20 group-hover:bg-violet-500/20",
  audio: "bg-pink-500/12 text-pink-500 ring-1 ring-pink-500/20 group-hover:bg-pink-500/20",
  document: "bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20 group-hover:bg-orange-500/20",
  text: "bg-amber-500/12 text-amber-500 ring-1 ring-amber-500/20 group-hover:bg-amber-500/20",
  developer: "bg-cyan-500/12 text-cyan-500 ring-1 ring-cyan-500/20 group-hover:bg-cyan-500/20",
  security: "bg-green-500/12 text-green-500 ring-1 ring-green-500/20 group-hover:bg-green-500/20",
  network: "bg-teal-500/12 text-teal-500 ring-1 ring-teal-500/20 group-hover:bg-teal-500/20",
  seo: "bg-fuchsia-500/12 text-fuchsia-500 ring-1 ring-fuchsia-500/20 group-hover:bg-fuchsia-500/20",
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={category.href}
          onClick={() => {
            trackCategoryOpen(category.slug);
          }}
          className="group flex items-start gap-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-[3px] hover:border-[var(--outline-strong)] hover:bg-[var(--surface-card-hover)] hover:shadow-[var(--shadow-lift)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
        >
          <span
            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl p-3.5 transition-all duration-200 group-hover:scale-105 ${categoryTileStyles[category.slug]}`}
          >
            {categoryIcons[category.slug]}
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
              {category.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {category.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
