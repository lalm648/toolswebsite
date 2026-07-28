"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ToolDefinition } from "@/lib/data/tools";
import { trackToolOpen } from "@/lib/analytics";

type ToolCardProps = {
  tool: ToolDefinition;
  variant?: "standard" | "featured" | "compact" | "spotlight";
  badge?: string;
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

// Theme-adaptive translucent tints: readable on both the light and dark navy
// card surfaces, and filling with solid color on hover.
const categoryAccentStyles: Record<ToolDefinition["category"], string> = {
  image: "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-500/40",
  video: "bg-violet-500/12 text-violet-500 ring-1 ring-violet-500/20 group-hover:bg-violet-500 group-hover:text-white group-hover:ring-violet-500/40",
  audio: "bg-pink-500/12 text-pink-500 ring-1 ring-pink-500/20 group-hover:bg-pink-500 group-hover:text-white group-hover:ring-pink-500/40",
  document: "bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-500/40",
  text: "bg-amber-500/12 text-amber-500 ring-1 ring-amber-500/20 group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500/40",
  developer: "bg-cyan-500/12 text-cyan-500 ring-1 ring-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white group-hover:ring-cyan-500/40",
  security: "bg-green-500/12 text-green-500 ring-1 ring-green-500/20 group-hover:bg-green-500 group-hover:text-white group-hover:ring-green-500/40",
  network: "bg-teal-500/12 text-teal-500 ring-1 ring-teal-500/20 group-hover:bg-teal-500 group-hover:text-white group-hover:ring-teal-500/40",
  seo: "bg-fuchsia-500/12 text-fuchsia-500 ring-1 ring-fuchsia-500/20 group-hover:bg-fuchsia-500 group-hover:text-white group-hover:ring-fuchsia-500/40",
};

const variedAccentStyles = [
  "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white",
  "bg-cyan-500/12 text-cyan-600 ring-1 ring-cyan-500/20 group-hover:bg-cyan-600 group-hover:text-white",
  "bg-blue-500/12 text-blue-600 ring-1 ring-blue-500/20 group-hover:bg-blue-600 group-hover:text-white",
  "bg-violet-500/12 text-violet-600 ring-1 ring-violet-500/20 group-hover:bg-violet-600 group-hover:text-white",
  "bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20 group-hover:bg-amber-500 group-hover:text-white",
  "bg-rose-500/12 text-rose-600 ring-1 ring-rose-500/20 group-hover:bg-rose-600 group-hover:text-white",
];

function variedAccent(slug: string) {
  const value = Array.from(slug).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return variedAccentStyles[value % variedAccentStyles.length];
}

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

const categoryLabels: Record<ToolDefinition["category"], string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "PDF & document",
  text: "Text",
  developer: "Developer",
  security: "Security",
  network: "Network",
  seo: "SEO",
};

export default function ToolCard({ tool, variant = "standard", badge }: ToolCardProps) {
  const featured = variant === "featured";
  const compact = variant === "compact";
  const spotlight = variant === "spotlight";
  const icon = iconMap[tool.icon] ?? categoryIconMap[tool.category];
  const accentStyle =
    tool.category === "image" ? variedAccent(tool.slug) : categoryAccentStyles[tool.category];

  if (compact) {
    return (
      <Link
        href={tool.href}
        onClick={() => trackToolOpen(tool.slug, tool.category)}
        aria-label={`Open ${tool.title}, ${categoryLabels[tool.category]} tool`}
        className="group flex min-h-20 min-w-0 max-w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--surface-raised)] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--outline-strong)] hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
      >
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] p-2.5 transition-all group-hover:scale-105 ${accentStyle}`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
            {tool.title}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--muted-foreground)]">
            {tool.description}
          </span>
        </span>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--outline-soft)] text-sm text-[var(--accent-700)] transition-transform group-hover:translate-x-0.5 group-hover:border-[var(--accent-200)] group-hover:bg-[var(--accent-50)]"
          aria-hidden="true"
        >
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={tool.href}
      onClick={() => {
        trackToolOpen(tool.slug, tool.category);
      }}
      aria-label={`Open ${tool.title}, ${categoryLabels[tool.category]} tool`}
      className="group block h-full rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
    >
      <Card
        className={`relative h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)] ${
          spotlight
            ? "border-0 bg-[var(--surface-cta)] shadow-[0_24px_55px_-36px_rgba(15,23,42,0.9)]"
            : "border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)] group-hover:border-[var(--outline-strong)]"
        }`}
      >
        {spotlight ? (
          <>
            <span
              className="absolute -right-12 -top-16 h-52 w-52 rounded-full border border-white/10 bg-white/5"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400"
              aria-hidden="true"
            />
          </>
        ) : null}
        <CardContent
          className={`relative flex h-full flex-col ${
            spotlight
              ? "min-h-64 p-6 sm:p-7"
              : featured
                ? "min-h-60 p-5"
                : "min-h-52 p-5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105 ${
                spotlight
                  ? "h-14 w-14 bg-white/10 p-3 text-white ring-1 ring-white/15"
                  : featured
                    ? "h-12 w-12 p-2.5"
                    : "h-11 w-11 p-2.5"
              } ${spotlight ? "" : accentStyle}`}
            >
              {icon}
            </span>
            {badge ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  spotlight
                    ? "border border-white/10 bg-white/10 text-white/75"
                    : "bg-[var(--accent-50)] text-[var(--accent-700)]"
                }`}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <p
            className={`mt-5 line-clamp-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
              spotlight ? "text-white/50" : "text-[var(--muted-foreground)]"
            }`}
          >
            {tool.meta}
          </p>
          <h3
            className={`font-bold tracking-tight ${
              spotlight
                ? "mt-2 text-2xl text-white sm:text-3xl"
                : featured
                  ? "mt-1.5 text-lg text-[var(--ink-900)] group-hover:text-[var(--accent-700)]"
                  : "mt-1.5 text-[15px] text-[var(--ink-900)] group-hover:text-[var(--accent-700)]"
            }`}
          >
            {tool.title}
          </h3>
          <p
            className={`mt-2 ${
              spotlight
                ? "max-w-xl text-sm leading-6 text-white/65"
                : featured
                  ? "text-sm leading-6 text-[var(--muted-foreground)]"
                  : "line-clamp-2 text-[13px] leading-6 text-[var(--muted-foreground)]"
            }`}
          >
            {tool.description}
          </p>
          <span
            className={`mt-auto inline-flex items-center justify-between pt-5 text-xs font-bold ${
              spotlight ? "text-white" : "text-[var(--accent-700)]"
            }`}
          >
            <span
              className={
                spotlight
                  ? "rounded-full bg-white px-4 py-2.5 text-slate-950 shadow-lg"
                  : ""
              }
            >
              {spotlight ? "Start this workflow" : "Open tool"}
            </span>
            <span
              className={`text-base transition-transform group-hover:translate-x-1 ${
                spotlight
                  ? "grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5"
                  : ""
              }`}
              aria-hidden="true"
            >
              →
            </span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
