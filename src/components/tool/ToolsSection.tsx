import { Badge } from "@/components/ui/badge";
import ToolCard from "@/components/tool/ToolCard";
import ToolsEmptyState from "@/components/tool/ToolsEmptyState";
import type { ToolDefinition } from "@/lib/data/tools";

type ToolsSectionProps = {
  title: string;
  description: string;
  tools: ToolDefinition[];
  query: string;
};

export default function ToolsSection({
  title,
  description,
  tools,
  query,
}: ToolsSectionProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Ready to use
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink-900)]">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
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
