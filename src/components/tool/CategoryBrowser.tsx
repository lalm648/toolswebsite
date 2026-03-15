"use client";

import { useMemo, useState } from "react";
import NewsletterSignup from "@/components/lead/NewsletterSignup";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import RevealOnScroll from "@/components/RevealOnScroll";
import ContentSection from "@/components/seo/ContentSection";
import CTABlock from "@/components/tool/CTABlock";
import CategoryHero from "@/components/tool/CategoryHero";
import FAQSection from "@/components/tool/FAQSection";
import ToolsSection from "@/components/tool/ToolsSection";
import type { CategoryDefinition, ToolDefinition } from "@/lib/data/tools";
import { categorySeoContent } from "@/lib/seo/content";
import { siteFlags } from "@/lib/site-flags";

type CategoryBrowserProps = {
  category: CategoryDefinition;
  tools: ToolDefinition[];
};

export default function CategoryBrowser({ category, tools }: CategoryBrowserProps) {
  const [query, setQuery] = useState("");
  const seoContent = categorySeoContent[category.slug];

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

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <ToolsSection
          title="Choose the workflow you need"
          description="Start with conversion, compression, or resizing. Each card leads into a dedicated tool page, and the layout is designed to scale cleanly as more utilities are added."
          tools={filteredTools}
          query={query}
        />
      </div>

      {seoContent ? (
        <ContentSection
          eyebrow={category.eyebrow}
          title={`About ${category.title}`}
          intro={seoContent.intro}
          highlights={seoContent.highlights}
          faq={seoContent.faq}
        />
      ) : null}

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <FAQSection
          items={[
            {
              question: "Will these tools work directly in the browser?",
              answer: "Yes. The main workflows in this section are designed to run in the browser so simple tasks stay fast and easier to use.",
            },
            {
              question: "Which tool should I start with?",
              answer: `Start with the task you need right now. This ${category.title.toLowerCase()} section is organized so you can move from browsing into a focused tool page quickly.`,
            },
          ]}
        />
      </div>

      {siteFlags.showNewsletterSignup || siteFlags.showWaitlistBlock ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {siteFlags.showNewsletterSignup ? (
            <RevealOnScroll>
              <NewsletterSignup source={`category_${category.slug}`} />
            </RevealOnScroll>
          ) : null}

          {siteFlags.showWaitlistBlock ? (
            <RevealOnScroll>
              <WaitlistBlock
                source={`category_${category.slug}`}
                title={`Join the ${category.slug} workflow waitlist`}
                description={`Get notified when new ${category.title.toLowerCase()} features, deeper automation, and premium workflow bundles are added.`}
              />
            </RevealOnScroll>
          ) : null}
        </div>
      ) : null}

      <CTABlock
        title="The category foundation is ready for real tool flows"
        description="Next we can implement each image tool one by one without redesigning the overall browsing experience."
        href={filteredTools[0]?.href ?? category.href}
        label={filteredTools.length ? "Open first tool" : "Browse all tools"}
      />
    </div>
  );
}
