"use client";

import { useMemo, useState } from "react";
import NewsletterSignup from "@/components/lead/NewsletterSignup";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import RevealOnScroll from "@/components/RevealOnScroll";
import ContentSection from "@/components/seo/ContentSection";
import CTABlock from "@/components/tool/CTABlock";
import CategoryHero from "@/components/tool/CategoryHero";
import ToolsSection from "@/components/tool/ToolsSection";
import type { CategoryDefinition, ToolDefinition } from "@/lib/data/tools";
import { categorySeoContent } from "@/lib/seo/content";
import { siteUrl } from "@/lib/seo/metadata";
import { siteFlags } from "@/lib/site-flags";
import { getCategoryInternalLinks, trustedResources } from "@/lib/seo/links";

type CategoryBrowserProps = {
  category: CategoryDefinition;
  tools: ToolDefinition[];
};

export default function CategoryBrowser({
  category,
  tools,
}: CategoryBrowserProps) {
  const [query, setQuery] = useState("");
  const seoContent = categorySeoContent[category.slug];
  const categoryUrl = `${siteUrl}${category.href}`;
  const categoryJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.title,
      description: category.description,
      url: categoryUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: `${siteUrl}${tool.href}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: category.title,
          item: categoryUrl,
        },
      ],
    },
    ...(seoContent?.faq?.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seoContent.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }]
      : []),
  ];

  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return tools;
    }

    return tools.filter((tool) =>
      [tool.title, tool.description, tool.meta].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, tools]);

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categoryJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CategoryHero category={category} value={query} onChange={setQuery} />

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <ToolsSection
          title="Choose the workflow you need"
          description={`Browse ${category.title.toLowerCase()} by task. Every card opens a focused utility with clear local-processing and download controls.`}
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
          internalLinks={getCategoryInternalLinks(category.slug)}
          externalLinks={trustedResources[category.slug]}
          faq={seoContent.faq}
        />
      ) : null}

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
        title={`Start working with ${category.title.toLowerCase()}`}
        description="Choose a focused utility, process your content, and download the result with no account required."
        href={filteredTools[0]?.href ?? category.href}
        label={filteredTools.length ? "Open first tool" : "Browse all tools"}
      />
    </div>
  );
}
