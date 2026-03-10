export type ToolCategorySlug = "image" | "text" | "developer" | "seo";

export type CategoryDefinition = {
  slug: ToolCategorySlug;
  title: string;
  description: string;
  href: string;
  eyebrow: string;
  badge: string;
};

export const categories: CategoryDefinition[] = [
  {
    slug: "image",
    title: "Image Tools",
    description: "Convert, compress, resize, and optimize images directly in the browser.",
    href: "/tools/image",
    eyebrow: "Fast browser workflows",
    badge: "Popular category",
  },
  {
    slug: "text",
    title: "Text Tools",
    description: "Count, clean, and transform text for writing and editing workflows.",
    href: "/tools/text",
    eyebrow: "Writing workflows",
    badge: "Content essentials",
  },
  {
    slug: "developer",
    title: "Developer Tools",
    description: "Format JSON, encode content, and handle common development utilities.",
    href: "/tools/developer",
    eyebrow: "Engineering utilities",
    badge: "Developer ready",
  },
  {
    slug: "seo",
    title: "SEO Tools",
    description: "Generate metadata and search-focused helpers for modern websites.",
    href: "/tools/seo",
    eyebrow: "Search optimization",
    badge: "Growth toolkit",
  },
];

export type ToolDefinition = {
  slug: string;
  title: string;
  description: string;
  href: string;
  category: ToolCategorySlug;
  meta: string;
  icon:
    | "jpg-to-png"
    | "png-to-jpg"
    | "jpg-to-webp"
    | "jpg-to-avif"
    | "png-to-webp"
    | "png-to-avif"
    | "image-compressor"
    | "image-resizer"
    | "word-counter"
    | "case-converter"
    | "json-formatter"
    | "base64-encoder"
    | "meta-tag-generator";
};

export const tools: ToolDefinition[] = [
  {
    slug: "jpg-to-png",
    title: "JPG to PNG",
    description: "Convert JPG files into clean PNG exports with a privacy-first browser flow.",
    href: "/tools/image/jpg-to-png",
    category: "image",
    meta: "Image conversion",
    icon: "jpg-to-png",
  },
  {
    slug: "png-to-jpg",
    title: "PNG to JPG",
    description: "Create lighter JPG files from PNG images for faster uploads and sharing.",
    href: "/tools/image/png-to-jpg",
    category: "image",
    meta: "Image conversion",
    icon: "png-to-jpg",
  },
  {
    slug: "jpg-to-webp",
    title: "JPG to WebP",
    description: "Convert JPG files into efficient WebP images with a browser-first workflow.",
    href: "/tools/image/jpg-to-webp",
    category: "image",
    meta: "Image conversion",
    icon: "jpg-to-webp",
  },
  {
    slug: "jpg-to-avif",
    title: "JPG to AVIF",
    description: "Convert JPG files into compact AVIF images for modern web delivery.",
    href: "/tools/image/jpg-to-avif",
    category: "image",
    meta: "Image conversion",
    icon: "jpg-to-avif",
  },
  {
    slug: "png-to-webp",
    title: "PNG to WebP",
    description: "Turn PNG images into WebP files while keeping a fast browser-based workflow.",
    href: "/tools/image/png-to-webp",
    category: "image",
    meta: "Image conversion",
    icon: "png-to-webp",
  },
  {
    slug: "png-to-avif",
    title: "PNG to AVIF",
    description: "Convert PNG images to AVIF for modern compression and browser delivery.",
    href: "/tools/image/png-to-avif",
    category: "image",
    meta: "Image conversion",
    icon: "png-to-avif",
  },
  {
    slug: "image-compressor",
    title: "Image Compressor",
    description: "Reduce image file size while keeping quality suitable for web and mobile.",
    href: "/tools/image/image-compressor",
    category: "image",
    meta: "Optimization",
    icon: "image-compressor",
  },
  {
    slug: "image-resizer",
    title: "Image Resizer",
    description: "Resize visuals for marketplaces, social profiles, landing pages, and ads.",
    href: "/tools/image/image-resizer",
    category: "image",
    meta: "Sizing",
    icon: "image-resizer",
  },
  {
    slug: "word-counter",
    title: "Word Counter",
    description: "Count words, characters, and paragraphs instantly in the browser.",
    href: "/tools/text/word-counter",
    category: "text",
    meta: "Writing utility",
    icon: "word-counter",
  },
  {
    slug: "case-converter",
    title: "Case Converter",
    description: "Convert text between upper, lower, title, and sentence case quickly.",
    href: "/tools/text/case-converter",
    category: "text",
    meta: "Text formatting",
    icon: "case-converter",
  },
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "Format and validate JSON data with a clean developer-focused interface.",
    href: "/tools/developer/json-formatter",
    category: "developer",
    meta: "Developer utility",
    icon: "json-formatter",
  },
  {
    slug: "base64-encoder",
    title: "Base64 Encoder",
    description: "Encode and decode content quickly for debugging and transport workflows.",
    href: "/tools/developer/base64-encoder",
    category: "developer",
    meta: "Encoding",
    icon: "base64-encoder",
  },
  {
    slug: "meta-tag-generator",
    title: "Meta Tag Generator",
    description: "Draft SEO metadata with a simple structure for titles and descriptions.",
    href: "/tools/seo/meta-tag-generator",
    category: "seo",
    meta: "SEO utility",
    icon: "meta-tag-generator",
  },
];

export function getCategoryBySlug(slug: ToolCategorySlug) {
  return categories.find((category) => category.slug === slug);
}

export function getToolsByCategory(slug: ToolCategorySlug) {
  return tools.filter((tool) => tool.category === slug);
}
