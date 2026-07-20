import Link from "next/link";
import { categories, getToolsByCategory, tools } from "@/lib/data/tools";

export default function CompleteToolIndex() {
  return (
    <section aria-labelledby="complete-tool-index-title" className="border-y border-[var(--outline-soft)] py-2">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-3 py-3 text-left hover:bg-[var(--surface-panel)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] [&::-webkit-details-marker]:hidden">
          <span>
            <span id="complete-tool-index-title" className="block font-bold text-[var(--ink-900)]">
              Complete tool index
            </span>
            <span className="mt-0.5 block text-sm text-[var(--muted-foreground)]">
              All {tools.length} tool links, grouped by category
            </span>
          </span>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--outline-soft)] text-[var(--accent-700)] transition-transform group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>

        <div className="grid gap-x-8 gap-y-7 px-3 pb-7 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const categoryTools = getToolsByCategory(category.slug);
            return (
              <div key={category.slug}>
                <h3 className="text-sm font-bold text-[var(--ink-900)]">
                  <Link href={category.href} className="hover:text-[var(--accent-700)]">
                    {category.title} <span aria-hidden="true">→</span>
                  </Link>
                </h3>
                <ul className="mt-3 columns-1 space-y-2">
                  {categoryTools.map((tool) => (
                    <li key={tool.href} className="break-inside-avoid">
                      <Link href={tool.href} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--accent-700)] hover:underline">
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
