import type { ToolDefinition } from "@/lib/data/tools";
import { getToolExperience } from "@/lib/data/tool-experience";

export default function ToolExperiencePanel({
  tool,
}: {
  tool: ToolDefinition;
}) {
  const experience = getToolExperience(tool);
  const stages = [
    { label: "Input", value: experience.input },
    { label: "Refine", value: experience.controls },
    { label: "Review", value: experience.preview },
    { label: "Finish", value: experience.output },
  ];

  return (
    <section
      aria-labelledby="tool-workflow-title"
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--outline-soft)] bg-[linear-gradient(120deg,var(--accent-50),var(--surface-raised)_52%,var(--surface-panel))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-700)]">
            Purpose-built workflow
          </p>
          <h2
            id="tool-workflow-title"
            className="mt-1 text-base font-semibold text-[var(--ink-900)] sm:text-lg"
          >
            {experience.intent}
          </h2>
        </div>
        <ul
          aria-label="Tool capabilities"
          className="flex flex-wrap gap-1.5"
        >
          {experience.capabilities.map((capability) => (
            <li
              key={capability}
              className="rounded-full border border-[var(--accent-200)] bg-[var(--surface-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-700)]"
            >
              {capability}
            </li>
          ))}
        </ul>
      </div>
      <ol className="grid gap-px bg-[var(--outline-soft)] sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, index) => (
          <li
            key={stage.label}
            className="flex min-h-20 gap-3 bg-[var(--surface-raised)] px-4 py-3.5"
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-100)] text-[11px] font-bold tabular-nums text-[var(--accent-700)]"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                {stage.label}
              </span>
              <span className="mt-1 block text-xs font-medium leading-5 text-[var(--ink-900)]">
                {stage.value}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
