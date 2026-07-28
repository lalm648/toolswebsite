import type { ReactNode } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import ContentSection from "@/components/seo/ContentSection";
import RelatedTools from "@/components/tool/RelatedTools";
import ToolExperiencePanel from "@/components/tool/ToolExperiencePanel";
import AdSlot from "@/components/monetization/AdSlot";
import { Badge } from "@/components/ui/badge";
import { siteFlags } from "@/lib/site-flags";
import {
  getCategoryBySlug,
  getRelatedTools,
  getToolByTitle,
} from "@/lib/data/tools";
import { categorySeoContent, toolSeoContent } from "@/lib/seo/content";
import { siteUrl } from "@/lib/seo/metadata";
import {
  getContextualInternalLinks,
  getToolSteps,
  getToolTips,
  trustedResources,
} from "@/lib/seo/links";

type ToolShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function ToolShell({
  eyebrow,
  title,
  description,
  children,
}: ToolShellProps) {
  const tool = getToolByTitle(title);
  const category = tool ? getCategoryBySlug(tool.category) : null;
  const seoContent = tool ? toolSeoContent[tool.slug] : null;
  const resolvedSeoContent =
    seoContent ??
    (tool && category
      ? {
          intro: [tool.description, categorySeoContent[category.slug].intro[0]],
          highlights: categorySeoContent[category.slug].highlights,
          useCases: [
            `Complete a focused ${tool.title.toLowerCase()} task without installing desktop software.`,
            "Review the result before saving or copying it into the next workflow.",
            category.slug === "network"
              ? "Run controlled diagnostics against authorized public destinations."
              : "Keep source files and content within the current browser session.",
          ],
          faq: categorySeoContent[category.slug].faq,
        }
      : null);
  const relatedTools = tool ? getRelatedTools(tool.slug, tool.category) : [];
  const steps = tool ? getToolSteps(tool) : [];
  const canonicalUrl = tool ? `${siteUrl}${tool.href}` : siteUrl;
  const processingSignal =
    category?.slug === "network"
      ? {
          label: "Protected request",
          detail: "Only the public destination is sent",
        }
      : {
          label: "Browser processing",
          detail: "Files stay local where supported",
        };
  const breadcrumbJsonLd =
    tool && category
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: siteUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: category.title,
              item: `${siteUrl}${category.href}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: tool.title,
              item: canonicalUrl,
            },
          ],
        }
      : null;
  const pageJsonLd =
    tool && category
      ? {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: tool.title,
          description,
          inLanguage: "en",
          isPartOf: { "@id": `${siteUrl}/#website` },
          publisher: {
            "@id": `${siteUrl}/#organization`,
          },
          breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
          about: {
            "@type": "Thing",
            name: tool.title,
            description: tool.description,
          },
        }
      : null;
  const faqJsonLd = resolvedSeoContent?.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: resolvedSeoContent.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;
  const howToJsonLd = tool && steps.length
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "@id": `${canonicalUrl}#howto`,
        name: `How to use ${tool.title}`,
        description: tool.description,
        step: steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.name,
          text: step.text,
          url: `${canonicalUrl}#step-${index + 1}`,
        })),
      }
    : null;

  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-7 sm:space-y-8">
        {breadcrumbJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                [pageJsonLd, breadcrumbJsonLd, howToJsonLd, faqJsonLd].filter(Boolean),
              ).replace(/</g, "\\u003c"),
            }}
          />
        ) : null}

        <div className="mx-auto max-w-3xl text-center">
          {category ? (
            <nav
              aria-label="Breadcrumb"
              className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]"
            >
              <Link href="/" className="hover:text-[var(--accent-700)]">
                Home
              </Link>
              <span aria-hidden="true">›</span>
              <Link
                href={category.href}
                className="hover:text-[var(--accent-700)]"
              >
                {category.title}
              </Link>
              <span aria-hidden="true">›</span>
              <span className="font-medium text-[var(--ink-900)]">{title}</span>
            </nav>
          ) : null}
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
            {description}
          </p>
        </div>

        {tool && category ? (
          <ul
            aria-label="Tool access and privacy"
            className="mx-auto grid max-w-3xl gap-2 rounded-[var(--radius-md)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-2 sm:grid-cols-3"
          >
            {[
              {
                label: "Free to use",
                detail: "No payment required",
              },
              {
                label: "No account",
                detail: "Start immediately",
              },
              processingSignal,
            ].map((signal) => (
              <li
                key={signal.label}
                className="flex min-w-0 items-center gap-3 rounded-xl bg-[var(--surface-raised)] px-3 py-2.5"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-50)] text-xs font-bold text-[var(--accent-700)]"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[var(--ink-900)]">
                    {signal.label}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--muted-foreground)]">
                    {signal.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {tool ? <ToolExperiencePanel tool={tool} /> : null}

        {children}

        {siteFlags.showAdSlots ? (
          <AdSlot
            placement="tool-in-content"
            className="mx-auto w-full max-w-3xl"
          />
        ) : null}

        {resolvedSeoContent ? (
          <ContentSection
            eyebrow={eyebrow}
            title={`What does ${title} do?`}
            intro={resolvedSeoContent.intro}
            highlights={resolvedSeoContent.highlights}
            useCases={resolvedSeoContent.useCases}
            steps={steps}
            tips={tool ? getToolTips(tool) : []}
            internalLinks={tool ? getContextualInternalLinks(tool) : []}
            externalLinks={tool ? trustedResources[tool.category] : []}
            faq={resolvedSeoContent.faq}
          />
        ) : null}

        {relatedTools.length ? <RelatedTools tools={relatedTools} /> : null}
      </Container>
    </section>
  );
}
