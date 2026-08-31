import type { ReactNode } from "react";
import type { ToolCategorySlug } from "@/lib/data/tools";

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

export const categoryIcons: Record<ToolCategorySlug, ReactNode> = {
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
  // An open book with a ribbon marker — a reference work, not a text file.
  dictionary: (
    <svg {...iconProps}>
      <path d="M12 6.5C10.3 5.2 8.2 4.5 5.5 4.5v12c2.7 0 4.8.7 6.5 2 1.7-1.3 3.8-2 6.5-2v-12c-2.7 0-4.8.7-6.5 2Z" />
      <path d="M12 6.5v12" />
      <path d="M15.5 4.8v4l1.5-1.2 1.5 1.2v-4" />
    </svg>
  ),
};

export const categoryTileStyles: Record<ToolCategorySlug, string> = {
  image: "bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20",
  video: "bg-violet-500/12 text-violet-500 ring-1 ring-violet-500/20 group-hover:bg-violet-500/20",
  audio: "bg-pink-500/12 text-pink-500 ring-1 ring-pink-500/20 group-hover:bg-pink-500/20",
  document: "bg-orange-500/12 text-orange-500 ring-1 ring-orange-500/20 group-hover:bg-orange-500/20",
  text: "bg-amber-500/12 text-amber-500 ring-1 ring-amber-500/20 group-hover:bg-amber-500/20",
  developer: "bg-cyan-500/12 text-cyan-500 ring-1 ring-cyan-500/20 group-hover:bg-cyan-500/20",
  security: "bg-green-500/12 text-green-500 ring-1 ring-green-500/20 group-hover:bg-green-500/20",
  network: "bg-teal-500/12 text-teal-500 ring-1 ring-teal-500/20 group-hover:bg-teal-500/20",
  seo: "bg-fuchsia-500/12 text-fuchsia-500 ring-1 ring-fuchsia-500/20 group-hover:bg-fuchsia-500/20",
  dictionary: "bg-indigo-500/12 text-indigo-500 ring-1 ring-indigo-500/20 group-hover:bg-indigo-500/20",
};

export const categorySurfaceStyles: Record<ToolCategorySlug, string> = {
  image: "bg-emerald-500/[0.055] hover:bg-emerald-500/[0.09]",
  video: "bg-violet-500/[0.055] hover:bg-violet-500/[0.09]",
  audio: "bg-pink-500/[0.055] hover:bg-pink-500/[0.09]",
  document: "bg-orange-500/[0.055] hover:bg-orange-500/[0.09]",
  text: "bg-amber-500/[0.055] hover:bg-amber-500/[0.09]",
  developer: "bg-cyan-500/[0.055] hover:bg-cyan-500/[0.09]",
  security: "bg-green-500/[0.055] hover:bg-green-500/[0.09]",
  network: "bg-teal-500/[0.055] hover:bg-teal-500/[0.09]",
  seo: "bg-fuchsia-500/[0.055] hover:bg-fuchsia-500/[0.09]",
  dictionary: "bg-indigo-500/[0.055] hover:bg-indigo-500/[0.09]",
};
