import ToolCard from "@/components/tool/ToolCard";
import type { ToolDefinition } from "@/lib/data/tools";

type RelatedToolsProps = {
  tools: ToolDefinition[];
};

export default function RelatedTools({ tools }: RelatedToolsProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Related tools
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Keep exploring
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </section>
  );
}
