"use client";

import { useMemo, useState } from "react";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import ContentSection from "@/components/seo/ContentSection";
import CategoryHero from "@/components/tool/CategoryHero";
import CategoryToolDirectory from "@/components/tool/CategoryToolDirectory";
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
      "@id": `${categoryUrl}#collection`,
      name: category.title,
      description: category.description,
      url: categoryUrl,
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      breadcrumb: { "@id": `${categoryUrl}#breadcrumb` },
      mainEntity: {
        "@type": "ItemList",
        "@id": `${categoryUrl}#tools`,
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          item: `${siteUrl}${tool.href}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${categoryUrl}#breadcrumb`,
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
          "@id": `${categoryUrl}#faq`,
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
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categoryJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CategoryHero
        category={category}
        toolCount={tools.length}
        value={query}
        onChange={setQuery}
      />

      <div id="category-tools" className="scroll-mt-24">
        <CategoryToolDirectory
          category={category}
          tools={filteredTools}
          query={query}
        />
      </div>

      {seoContent ? (
        <ContentSection
          eyebrow={category.eyebrow}
          title={`What can you do with ${category.title.toLowerCase()}?`}
          intro={seoContent.intro}
          highlights={seoContent.highlights}
          internalLinks={getCategoryInternalLinks(category.slug)}
          externalLinks={trustedResources[category.slug]}
          faq={seoContent.faq}
          compact
        />
      ) : null}

      {siteFlags.showWaitlistBlock ? (
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-panel)] p-5 sm:p-6">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-[var(--brand-500)]" aria-hidden="true" />
          <WaitlistBlock
            compact
            source={`category_${category.slug}`}
            title={`${category.title} early access`}
            description={`Request administrator-reviewed access to upcoming ${category.title.toLowerCase()} workflows and full early-access benefits.`}
          />
        </div>
      ) : null}
    </div>
  );
}
