import { Card, CardContent } from "@/components/ui/card";

type ToolsEmptyStateProps = {
  query: string;
};

export default function ToolsEmptyState({ query }: ToolsEmptyStateProps) {
  return (
    <Card className="border-dashed border-[var(--outline-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,246,255,0.95))]">
      <CardContent className="px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--brand-600)]">No tools match “{query}”</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">
          Try a broader search term
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
          Search by tool name or workflow, for example “compress”, “resize”, or “convert”.
        </p>
      </CardContent>
    </Card>
  );
}
