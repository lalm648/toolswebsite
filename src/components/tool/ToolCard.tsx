import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ToolDefinition } from "@/lib/data/tools";

type ToolCardProps = {
  tool: ToolDefinition;
};

const iconMap = {
  "jpg-to-png": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m6.5 16 3.5-3.5 2.8 2.8 2.2-2.2 2.5 2.9" />
      <path d="M7 3.5v4" />
      <path d="m6 6.5 1-1 1 1" />
      <path d="M17 20.5v-4" />
      <path d="m16 17.5 1 1 1-1" />
    </svg>
  ),
  "png-to-jpg": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M7 8.5h3" />
      <path d="M7 12h3" />
      <path d="M14 8.5h3" />
      <path d="M14 12h3" />
      <path d="M7 16h10" />
    </svg>
  ),
  "jpg-to-webp": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M7 10.5h2.5" />
      <path d="M7 14h4" />
      <path d="M13 8.5h4" />
      <path d="M13 12h4" />
      <path d="M13 15.5h2.5" />
    </svg>
  ),
  "jpg-to-avif": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M7 15.5 9.2 8.5h.8l2.2 7" />
      <path d="M7.8 13h3.2" />
      <path d="M14 8.5h3.5" />
      <path d="M15.75 8.5v7" />
      <path d="M13.5 15.5H18" />
    </svg>
  ),
  "png-to-webp": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M6.8 15.5V8.5h2.4c1.1 0 1.8.7 1.8 1.7 0 1.1-.8 1.8-1.9 1.8H6.8" />
      <path d="m12 8.5 1.5 7 1.4-5 1.4 5 1.5-7" />
    </svg>
  ),
  "png-to-avif": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M6.8 15.5V8.5h2.4c1.1 0 1.8.7 1.8 1.7 0 1.1-.8 1.8-1.9 1.8H6.8" />
      <path d="M13 15.5 15.2 8.5h.8l2.2 7" />
      <path d="M13.8 13H17" />
    </svg>
  ),
  "image-compressor": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M9 9.5h6" />
      <path d="M10 12h4" />
      <path d="M11 14.5h2" />
      <path d="M7.5 3.5v3" />
      <path d="M16.5 3.5v3" />
      <path d="M7.5 18.5v2" />
      <path d="M16.5 18.5v2" />
    </svg>
  ),
  "image-resizer": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 15 15 9" />
      <path d="M11 9h4v4" />
      <path d="M13 15H9v-4" />
    </svg>
  ),
  "rotate-image": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8V4l3 3-3 3V8h-5.5A6.5 6.5 0 1 0 19 14.5" />
      <path d="M18.8 11.5A6.5 6.5 0 0 1 8 18.3" />
    </svg>
  ),
  "crop-image": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3.5v11a2 2 0 0 0 2 2h10" />
      <path d="M3.5 8h11a2 2 0 0 1 2 2v10" />
      <path d="M6 6h12" />
      <path d="M6 6v12" />
    </svg>
  ),
  "word-counter": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7.5h14" />
      <path d="M8 12h8" />
      <path d="M10 16.5h4" />
      <path d="M4.5 18.5h3" />
    </svg>
  ),
  "case-converter": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 17 9.5 7h1L14 17" />
      <path d="M7.2 13.5h5.4" />
      <path d="M16 10.5c0-1.1.9-2 2-2s2 .9 2 2v3c0 1.1-.9 2-2 2s-2-.9-2-2" />
    </svg>
  ),
  "json-formatter": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9.5 5.5c-2 1.2-3 3.4-3 6.5s1 5.3 3 6.5" />
      <path d="M14.5 5.5c2 1.2 3 3.4 3 6.5s-1 5.3-3 6.5" />
      <path d="M11 9.5h2" />
      <path d="M11 12h2" />
      <path d="M11 14.5h2" />
    </svg>
  ),
  "base64-encoder": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="M8 10.5h3" />
      <path d="M8 13.5h3" />
      <path d="M14 10.5h2" />
      <path d="M14 13.5h4" />
    </svg>
  ),
  "meta-tag-generator": (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 6.5h14" />
      <path d="M5 10.5h7" />
      <path d="M5 14.5h10" />
      <path d="M17 13.5h2.5" />
      <path d="m18.5 12 1.5 1.5-1.5 1.5" />
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
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,var(--accent-100),var(--brand-100))] text-[var(--accent-600)] shadow-[0_8px_18px_-12px_rgba(109,124,255,0.35)] group-hover:scale-[1.03] group-hover:bg-[linear-gradient(135deg,var(--accent-500),var(--brand-500))] group-hover:text-white">
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
