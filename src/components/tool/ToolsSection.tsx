import { Badge } from "@/components/ui/badge";
import ToolCard from "@/components/tool/ToolCard";
import ToolsEmptyState from "@/components/tool/ToolsEmptyState";
import type { ToolDefinition } from "@/lib/data/tools";

type ToolsSectionProps = {
  title: string;
  description: string;
  tools: ToolDefinition[];
  query: string;
  compact?: boolean;
};

export default function ToolsSection({
  title,
  description,
  tools,
  query,
  compact = false,
}: ToolsSectionProps) {
  return (
    <section className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Ready to use
          </p>
          <h2 className={`mt-2 font-semibold tracking-tight text-[var(--ink-900)] ${compact ? "text-2xl" : "text-3xl"}`}>{title}</h2>
          <p className={`mt-2 text-sm text-[var(--muted-foreground)] ${compact ? "leading-6" : "leading-7"}`}>{description}</p>
        </div>
        <Badge variant="secondary" className="text-sm normal-case tracking-normal shadow-[var(--shadow-soft)]">
          {tools.length} tool{tools.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {tools.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <ToolsEmptyState query={query} />
      )}
    </section>
  );
}
