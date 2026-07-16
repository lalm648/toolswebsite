import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExtendedToolWorkbench from "@/components/tool/extended/ExtendedToolWorkbench";
import ToolShell from "@/components/tool/ToolShell";
import {
  categories,
  getToolBySlug,
  tools,
  type ToolCategorySlug,
} from "@/lib/data/tools";
import { buildToolMetadata } from "@/lib/seo/metadata";

type ExtendedToolPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

const dedicatedToolSlugs = new Set([
  "jpg-to-png",
  "png-to-jpg",
  "jpg-to-webp",
  "jpg-to-avif",
  "png-to-webp",
  "png-to-avif",
  "image-compressor",
  "image-resizer",
  "rotate-image",
  "crop-image",
  "word-counter",
  "case-converter",
  "remove-extra-spaces",
  "remove-empty-lines",
  "remove-duplicate-lines",
  "remove-line-breaks",
  "json-formatter",
  "base64-encoder",
  "meta-tag-generator",
]);

export function generateStaticParams() {
  return tools
    .filter((tool) => !dedicatedToolSlugs.has(tool.slug))
    .map((tool) => ({ category: tool.category, slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ExtendedToolPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const validCategory = categories.some((item) => item.slug === category);
  return validCategory ? buildToolMetadata(slug) : {};
}

export default async function ExtendedToolPage({
  params,
}: ExtendedToolPageProps) {
  const { category, slug } = await params;
  const validCategory = categories.some((item) => item.slug === category);
  const tool = validCategory
    ? getToolBySlug(slug, category as ToolCategorySlug)
    : null;

  if (!tool) notFound();

  return (
    <ToolShell
      eyebrow={tool.meta}
      title={tool.title}
      description={tool.description}
    >
      <ExtendedToolWorkbench category={tool.category} slug={tool.slug} />
    </ToolShell>
  );
}
