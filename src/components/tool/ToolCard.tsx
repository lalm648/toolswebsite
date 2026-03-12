import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ToolDefinition } from "@/lib/data/tools";

type ToolCardProps = {
  tool: ToolDefinition;
};

const iconProps = {
  "aria-hidden": "true",
  viewBox: "0 0 24 24",
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const categoryAccentStyles: Record<ToolDefinition["category"], string> = {
  image:
    "bg-[linear-gradient(180deg,rgba(96,165,250,0.16),rgba(59,130,246,0.06))] text-sky-700 ring-1 ring-sky-200/70 group-hover:bg-sky-600 group-hover:text-white group-hover:ring-sky-600/30",
  text:
    "bg-[linear-gradient(180deg,rgba(251,191,36,0.18),rgba(245,158,11,0.07))] text-amber-700 ring-1 ring-amber-200/80 group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500/30",
  developer:
    "bg-[linear-gradient(180deg,rgba(45,212,191,0.18),rgba(20,184,166,0.07))] text-teal-700 ring-1 ring-teal-200/80 group-hover:bg-teal-600 group-hover:text-white group-hover:ring-teal-600/30",
  seo:
    "bg-[linear-gradient(180deg,rgba(244,114,182,0.18),rgba(236,72,153,0.07))] text-pink-700 ring-1 ring-pink-200/80 group-hover:bg-pink-600 group-hover:text-white group-hover:ring-pink-600/30",
};

const iconMap = {
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

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      className="group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
    >
      <Card className="h-full bg-[var(--surface-card)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--outline-strong)] group-hover:shadow-[var(--shadow-lift)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] shadow-[0_10px_20px_-16px_rgba(15,23,42,0.28)] transition-all duration-200 group-hover:scale-[1.03] ${categoryAccentStyles[tool.category]}`}
            >
              {iconMap[tool.icon]}
            </span>
            <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
              {tool.meta}
            </Badge>
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">
            {tool.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">{tool.description}</p>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--ink-900)]">
            <span>Open tool</span>
            <span className="group-hover:translate-x-0.5 group-hover:text-[var(--brand-500)]">→</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
