"use client";

import { Badge } from "@/components/ui/badge";
import ToolCard from "@/components/tool/ToolCard";
import ToolsEmptyState from "@/components/tool/ToolsEmptyState";
import type {
  CategoryDefinition,
  ToolDefinition,
} from "@/lib/data/tools";

type CategoryToolDirectoryProps = {
  category: CategoryDefinition;
  tools: ToolDefinition[];
  query: string;
};

const featuredSlugs: Record<CategoryDefinition["slug"], string[]> = {
  image: ["image-compressor", "background-remover", "image-resizer"],
  video: ["video-compressor", "audio-extractor", "video-clipper"],
  audio: ["audio-joiner", "voice-recorder", "volume-normalizer"],
  document: ["pdf-merger", "pdf-text-extractor", "image-to-pdf"],
  text: ["word-counter", "case-converter", "remove-duplicate-lines"],
  developer: ["json-formatter", "sql-schema-visualizer", "code-minifier"],
  security: ["password-generator", "hash-calculator", "qr-code-generator"],
  network: ["ping-monitor", "broken-link-checker", "dns-inspector"],
  seo: ["meta-tag-generator"],
};

function categoryNoun(category: CategoryDefinition) {
  return category.title
    .toLowerCase()
    .replace(" tools", "")
    .replace(" & generators", "");
}

export default function CategoryToolDirectory({
  category,
  tools,
  query,
}: CategoryToolDirectoryProps) {
  if (!tools.length) return <ToolsEmptyState query={query} />;

  if (query.trim()) {
    return (
      <section aria-labelledby="search-results-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-700)]">
              Search results
            </p>
            <h2
              id="search-results-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)]"
            >
              Tools matching “{query.trim()}”
            </h2>
          </div>
          <Badge variant="secondary" className="w-fit">
            {tools.length} result{tools.length === 1 ? "" : "s"}
          </Badge>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} variant="featured" />
          ))}
        </div>
      </section>
    );
  }

  const preferred = featuredSlugs[category.slug];
  const featured = preferred
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is ToolDefinition => Boolean(tool));
  const featuredSet = new Set(featured.map((tool) => tool.slug));
  const remaining = tools.filter((tool) => !featuredSet.has(tool.slug));
  const groups = [...remaining.reduce((map, tool) => {
    const group = map.get(tool.meta) ?? [];
    group.push(tool);
    map.set(tool.meta, group);
    return map;
  }, new Map<string, ToolDefinition[]>())];

  return (
    <div className="space-y-10">
      <section aria-labelledby="featured-tools-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-700)]">
              Popular starting points
            </p>
            <h2
              id="featured-tools-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-3xl"
            >
              Start with a proven {categoryNoun(category)} workflow
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              The most useful everyday tasks, selected for fast access.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {tools.length} tools in this collection
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {featured.map((tool, index) => (
            <div
              key={tool.slug}
              className={index === 0 ? "lg:col-span-2" : ""}
            >
              <ToolCard
                tool={tool}
                variant={index === 0 ? "spotlight" : "featured"}
                badge={index === 0 ? "Recommended" : undefined}
              />
            </div>
          ))}
        </div>
      </section>

      {groups.length ? (
        <section aria-labelledby="workflow-groups-heading">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Complete collection
            </p>
            <h2
              id="workflow-groups-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-3xl"
            >
              Browse by workflow
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Related tools stay together, so you can compare the right
              workflow without scanning a wall of identical cards.
            </p>
          </div>

          <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2">
            {groups.map(([label, groupTools]) => (
              <section
                key={label}
                className={`min-w-0 rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 shadow-[var(--shadow-soft)] ${
                  groupTools.length > 4 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink-900)]">
                      {label}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Choose the exact result you need.
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[var(--muted-foreground)]">
                    {groupTools.length}
                  </span>
                </div>
                <div
                  className={
                    groupTools.length > 4
                      ? "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2"
                      : "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2"
                  }
                >
                  {groupTools.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} variant="compact" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
