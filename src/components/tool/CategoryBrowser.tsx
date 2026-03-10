"use client";

import { useMemo, useState } from "react";
import CTABlock from "@/components/tool/CTABlock";
import CategoryHero from "@/components/tool/CategoryHero";
import FAQSection from "@/components/tool/FAQSection";
import ToolsSection from "@/components/tool/ToolsSection";
import type { CategoryDefinition, ToolDefinition } from "@/lib/data/tools";

type CategoryBrowserProps = {
  category: CategoryDefinition;
  tools: ToolDefinition[];
};

export default function CategoryBrowser({ category, tools }: CategoryBrowserProps) {
  const [query, setQuery] = useState("");

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return tools;
    }

    return tools.filter((tool) =>
      [tool.title, tool.description, tool.meta].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [query, tools]);

  return (
    <div className="space-y-12">
      <CategoryHero category={category} value={query} onChange={setQuery} />

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[linear-gradient(180deg,rgba(241,245,255,0.92),rgba(255,245,251,0.82))] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <ToolsSection
          title="Choose the workflow you need"
          description="Start with conversion, compression, or resizing. Each card leads into a dedicated tool page, and the layout is designed to scale cleanly as more utilities are added."
          tools={filteredTools}
          query={query}
        />
      </div>

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(237,243,255,0.92))] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <FAQSection
          items={[
            {
              question: "Will these tools work directly in the browser?",
              answer: "That is the intended architecture. This category page is the polished foundation before image-processing logic is implemented tool by tool.",
            },
            {
              question: "Why focus on the category page first?",
              answer: "Because the category page sets the design system, search behavior, card pattern, and page rhythm that the rest of the tools sections will reuse.",
            },
          ]}
        />
      </div>

      <CTABlock
        title="The category foundation is ready for real tool flows"
        description="Next we can implement each image tool one by one without redesigning the overall browsing experience."
        href={filteredTools[0]?.href ?? category.href}
        label={filteredTools.length ? "Open first tool" : "Browse all tools"}
      />
    </div>
  );
}
