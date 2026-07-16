"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ToolDefinition } from "@/lib/data/tools";
import { trackToolOpen } from "@/lib/analytics";

type ToolCardProps = {
  tool: ToolDefinition;
};

const iconProps = {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  className: "h-6 w-6",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const categoryAccentStyles: Record<ToolDefinition["category"], string> = {
  image: "bg-sky-50 text-sky-600 ring-1 ring-sky-100 group-hover:bg-sky-600 group-hover:text-white",
  video: "bg-violet-50 text-violet-600 ring-1 ring-violet-100 group-hover:bg-violet-600 group-hover:text-white",
  audio: "bg-fuchsia-50 text-fuchsia-600 ring-1 ring-fuchsia-100 group-hover:bg-fuchsia-600 group-hover:text-white",
  document: "bg-orange-50 text-orange-600 ring-1 ring-orange-100 group-hover:bg-orange-600 group-hover:text-white",
  text: "bg-amber-50 text-amber-600 ring-1 ring-amber-100 group-hover:bg-amber-500 group-hover:text-white",
  developer: "bg-teal-50 text-teal-600 ring-1 ring-teal-100 group-hover:bg-teal-600 group-hover:text-white",
  security: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
  network: "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 group-hover:bg-cyan-600 group-hover:text-white",
  seo: "bg-pink-50 text-pink-600 ring-1 ring-pink-100 group-hover:bg-pink-600 group-hover:text-white",
};

const iconMap: Record<string, ReactNode> = {
  "jpg-to-png": (
    <svg {...iconProps}>
      <rect x="4.5" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M6.2 11.3 7.5 9.4l1 1.2 1-.9.8 1.4" />
      <path d="M13.5 9.5H20" />
      <path d="m17.5 7 2.5 2.5L17.5 12" />
      <rect x="14" y="14.5" width="5.5" height="4" rx="1.2" />
    </svg>
  ),
  "png-to-jpg": (
    <svg {...iconProps}>
      <rect x="13" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M15.2 9h2.1" />
      <path d="M16.3 9v4" />
      <path d="M4 9.5h6.5" />
      <path d="m8 7 2.5 2.5L8 12" />
      <rect x="4.5" y="14.5" width="5.5" height="4" rx="1.2" />
    </svg>
  ),
  "jpg-to-webp": (
    <svg {...iconProps}>
      <rect x="4.5" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M6.2 11.3 7.5 9.4l1 1.2 1-.9.8 1.4" />
      <path d="M13.5 8.5h6" />
      <path d="m14.2 13 1.1 2.4 1.2-3.4 1.2 3.4 1.1-2.4" />
    </svg>
  ),
  "jpg-to-avif": (
    <svg {...iconProps}>
      <rect x="4.5" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M6.2 11.3 7.5 9.4l1 1.2 1-.9.8 1.4" />
      <path d="M13.7 15.5 15.3 9l1.6 6.5" />
      <path d="M14.3 13.1h1.9" />
      <path d="M18.2 9v6.5" />
    </svg>
  ),
  "png-to-webp": (
    <svg {...iconProps}>
      <rect x="4.5" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M6 8.6h3.5" />
      <path d="M6 10.7h3.5" />
      <path d="M6 12.8h3.5" />
      <path d="m14.2 13 1.1 2.4 1.2-3.4 1.2 3.4 1.1-2.4" />
    </svg>
  ),
  "png-to-avif": (
    <svg {...iconProps}>
      <rect x="4.5" y="5.5" width="6.5" height="8" rx="1.8" />
      <path d="M6 8.6h3.5" />
      <path d="M6 10.7h3.5" />
      <path d="M6 12.8h3.5" />
      <path d="M13.7 15.5 15.3 9l1.6 6.5" />
      <path d="M14.3 13.1h1.9" />
      <path d="M18.2 9v6.5" />
    </svg>
  ),
  "image-compressor": (
    <svg {...iconProps}>
      <rect x="5.5" y="6" width="13" height="11" rx="2.5" />
      <path d="M9 10.5h6" />
      <path d="M10.5 13.5h3" />
      <path d="M7.5 6V4.5" />
      <path d="M16.5 6V4.5" />
      <path d="M7.5 19.5V18" />
      <path d="M16.5 19.5V18" />
    </svg>
  ),
  "image-resizer": (
    <svg {...iconProps}>
      <rect x="5" y="6" width="7" height="7" rx="1.8" />
      <path d="M14 10h5" />
      <path d="m16.5 7.5 2.5 2.5-2.5 2.5" />
      <path d="M10 15v5" />
      <path d="m7.5 17.5 2.5 2.5 2.5-2.5" />
    </svg>
  ),
  "rotate-image": (
    <svg {...iconProps}>
      <rect x="5" y="7" width="8" height="8" rx="2" />
      <path d="M17.5 6V3.5L20.5 6 17.5 8.5V6H12" />
      <path d="M18.6 10.8a6 6 0 1 1-2.2-3.6" />
    </svg>
  ),
  "crop-image": (
    <svg {...iconProps}>
      <path d="M8 4.5v10a2 2 0 0 0 2 2h10" />
      <path d="M4.5 8h10a2 2 0 0 1 2 2v10" />
      <rect x="6.5" y="6.5" width="8" height="8" rx="1.5" />
    </svg>
  ),
  "word-counter": (
    <svg {...iconProps}>
      <path d="M5 7.5h8" />
      <path d="M5 11.5h14" />
      <path d="M5 15.5h10" />
      <circle cx="18" cy="7.5" r="2.2" />
      <path d="M18 6.2v2.6" />
      <path d="M16.7 7.5h2.6" />
    </svg>
  ),
  "case-converter": (
    <svg {...iconProps}>
      <path d="M5.5 17 9 7h1l3.5 10" />
      <path d="M7 13h4" />
      <path d="M15.5 9.5h4" />
      <path d="M17.5 9.5v7" />
      <path d="M15.5 16.5h4" />
    </svg>
  ),
  "remove-extra-spaces": (
    <svg {...iconProps}>
      <path d="M5 8h3" />
      <path d="M11 8h2" />
      <path d="M16 8h3" />
      <path d="M6 15.5h12" />
      <path d="m9.5 12.2 2.5 2.6 2.5-2.6" />
    </svg>
  ),
  "remove-empty-lines": (
    <svg {...iconProps}>
      <path d="M5 7h14" />
      <path d="M5 12h6" />
      <path d="M13 12h6" />
      <path d="M8.5 16.5h7" />
      <path d="m10 10.2 2 2 2-2" />
    </svg>
  ),
  "remove-duplicate-lines": (
    <svg {...iconProps}>
      <path d="M5 7.5h8" />
      <path d="M5 12h8" />
      <path d="M5 16.5h8" />
      <path d="m15.5 9 1.7 1.7 3-3" />
      <path d="m15.5 16 1.7 1.7 3-3" />
    </svg>
  ),
  "remove-line-breaks": (
    <svg {...iconProps}>
      <path d="M5 8h14" />
      <path d="M5 12h9" />
      <path d="M5 16h14" />
      <path d="M14 12h4" />
      <path d="m16.5 10 2.5 2-2.5 2" />
    </svg>
  ),
  "json-formatter": (
    <svg {...iconProps}>
      <path d="M8.5 5.5c-2 1.2-3 3.4-3 6.5s1 5.3 3 6.5" />
      <path d="M15.5 5.5c2 1.2 3 3.4 3 6.5s-1 5.3-3 6.5" />
      <path d="M11 8.5h2" />
      <path d="M10 12h4" />
      <path d="M11 15.5h2" />
    </svg>
  ),
  "base64-encoder": (
    <svg {...iconProps}>
      <rect x="4.5" y="6" width="15" height="12" rx="3" />
      <path d="M7.5 10h3" />
      <path d="M7.5 14h3" />
      <path d="M13.5 10h3" />
      <path d="M13.5 14h3" />
      <path d="M11 8.5v7" />
    </svg>
  ),
  "meta-tag-generator": (
    <svg {...iconProps}>
      <path d="M5.5 8.5 8 6l2.5 2.5" />
      <path d="M18.5 8.5 16 6l-2.5 2.5" />
      <path d="M5 13h14" />
      <path d="M7 17h5" />
      <path d="M15 16.5h4" />
    </svg>
  ),
};

const categoryIconMap: Record<ToolDefinition["category"], ReactNode> = {
  image: <svg {...iconProps}><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="m5 17 4.5-4.5L14 17m-1-2 2.5-2.5L20 17" /></svg>,
  video: <svg {...iconProps}><rect x="4" y="6" width="12" height="12" rx="2.5" /><path d="m16 10 4-2v8l-4-2" /></svg>,
  audio: <svg {...iconProps}><path d="M9 18V7l9-2v11" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="15.5" cy="16" r="2.5" /></svg>,
  document: <svg {...iconProps}><path d="M7 3.5h7l4 4V20H7Z" /><path d="M14 3.5V8h4M10 12h5M10 15h5" /></svg>,
  text: <svg {...iconProps}><path d="M6 6h12M12 6v12M9.5 18h5" /></svg>,
  developer: <svg {...iconProps}><path d="m8 8-4 4 4 4m8-4 4 4-4 4m-2.5-10-3 12" /></svg>,
  security: <svg {...iconProps}><path d="M12 3.5 19 6v5.5c0 4.2-2.8 7.5-7 9-4.2-1.5-7-4.8-7-9V6Z" /><path d="m9.2 12 1.8 1.8 3.8-4" /></svg>,
  network: <svg {...iconProps}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.1 3.3 8.5s-1.1 6.2-3.3 8.5C9.8 18.2 8.7 15.4 8.7 12S9.8 5.8 12 3.5Z" /></svg>,
  seo: <svg {...iconProps}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.3-4.3" /></svg>,
};

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      onClick={() => {
        trackToolOpen(tool.slug, tool.category);
      }}
      className="group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
    >
      <Card className="h-full bg-[var(--surface-card)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--outline-strong)] group-hover:shadow-[var(--shadow-lift)]">
        <CardContent className="p-5">
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${categoryAccentStyles[tool.category]}`}
          >
            {iconMap[tool.icon] ?? categoryIconMap[tool.category]}
          </span>
          <h3 className="mt-4 text-base font-bold tracking-tight text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
            {tool.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">{tool.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
