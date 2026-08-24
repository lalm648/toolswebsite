import type { ReactNode } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import ContentSection from "@/components/seo/ContentSection";
import RelatedTools from "@/components/tool/RelatedTools";
import ToolExperiencePanel from "@/components/tool/ToolExperiencePanel";
import WorkbenchFrame from "@/components/tool/WorkbenchFrame";
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
  const isDictionary = category?.slug === "dictionary";
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
          keywords: categorySeoContent[category.slug].keywords,
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
      : category?.slug === "dictionary"
        ? // A reference tool takes no file, so "files stay local" would claim
          // nothing. Precisely: the word list is in the page, so search and
          // browsing need no connection. Senses and examples are fetched once, on
          // the first word opened, which is why this does not say "works offline".
          {
            label: "Search works offline",
            detail: "The word list loads with the page",
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
          isAccessibleForFree: true,
          keywords: resolvedSeoContent?.keywords?.join(", "),
          breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
          hasPart: [
            ...(steps.length ? [{ "@id": `${canonicalUrl}#howto` }] : []),
            ...(resolvedSeoContent?.faq?.length ? [{ "@id": `${canonicalUrl}#faq` }] : []),
          ],
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

  const accessSignals =
    tool && category
      ? [
          { label: "Free to use", detail: "No payment required" },
          { label: "No account", detail: "Start immediately" },
          processingSignal,
        ]
      : [];

  return (
    <section className={isDictionary ? "py-3 sm:py-5" : "py-6 sm:py-9"}>
      <Container className={isDictionary ? "space-y-3 sm:space-y-4" : "space-y-6 sm:space-y-7"}>
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

        {/*
          The tool is the reason the page exists, so it comes straight after the heading.
          It used to be the seventh block on the page — behind a breadcrumb, badge,
          heading, three-line description, a three-up trust strip, and a panel explaining
          the four steps the user was about to perform — which pushed the upload box to
          roughly 1,030px on a laptop and past 1,000px on a phone.

          Nothing was deleted: the trust claims are now one inline row, and the workflow
          panel moved below the tool. All the same text is still in the document.
        */}
        <div className="mx-auto max-w-3xl text-center">
          {category ? (
            <nav
              aria-label="Breadcrumb"
              className={`${isDictionary ? "mb-1.5 text-xs sm:mb-2" : "mb-3 text-sm"} flex flex-wrap items-center justify-center gap-2 text-[var(--muted-foreground)]`}
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
              <span
                aria-hidden="true"
                className={isDictionary ? "hidden sm:inline" : undefined}
              >
                ›
              </span>
              <span
                className={`${isDictionary ? "hidden sm:inline" : ""} font-medium text-[var(--ink-900)]`}
              >
                {title}
              </span>
            </nav>
          ) : null}
          {!isDictionary ? <Badge variant="secondary">{eyebrow}</Badge> : null}
          <h1 className={`${isDictionary ? "text-xl sm:text-3xl" : "mt-2.5 text-3xl sm:text-4xl"} font-semibold tracking-tight text-[var(--ink-900)]`}>
            {title}
          </h1>
          {!isDictionary ? (
            <p className="mx-auto mt-2.5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}

          {tool && category && !isDictionary ? (
            <ul
              aria-label="Tool access and privacy"
              className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]"
            >
              {accessSignals.map((signal) => (
                <li key={signal.label} className="flex items-center gap-1.5">
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--accent-100)] text-[9px] font-bold text-[var(--accent-700)]"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="font-semibold text-[var(--ink-900)]">
                    {signal.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <WorkbenchFrame category={category?.slug}>{children}</WorkbenchFrame>

        {isDictionary && accessSignals.length ? (
          <section
            aria-label="About this dictionary"
            className="rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5"
          >
            <div className="min-w-0">
              <Badge variant="secondary">{eyebrow}</Badge>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {description}
              </p>
            </div>
            <ul
              aria-label="Tool access and privacy"
              className="mt-3 flex shrink-0 flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)] sm:mt-0 sm:max-w-64"
            >
              {accessSignals.map((signal) => (
                <li key={signal.label} className="flex items-center gap-1.5">
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--accent-100)] text-[9px] font-bold text-[var(--accent-700)]"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="font-semibold text-[var(--ink-900)]">
                    {signal.label}
                  </span>
                  <span className="sr-only">: {signal.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tool ? <ToolExperiencePanel tool={tool} /> : null}

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
            faqIntro={
              category?.slug === "dictionary"
                ? "How the entries were sourced, how the spelling works, and what stays on your device."
                : undefined
            }
          />
        ) : null}

        {relatedTools.length ? <RelatedTools tools={relatedTools} /> : null}
      </Container>
    </section>
  );
}
