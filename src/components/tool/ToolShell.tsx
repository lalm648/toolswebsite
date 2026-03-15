import type { ReactNode } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import ContentSection from "@/components/seo/ContentSection";
import RelatedTools from "@/components/tool/RelatedTools";
import { Badge } from "@/components/ui/badge";
import { getCategoryBySlug, getRelatedTools, getToolByTitle } from "@/lib/data/tools";
import { toolSeoContent } from "@/lib/seo/content";
import { siteUrl } from "@/lib/seo/metadata";

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
  const relatedTools = tool ? getRelatedTools(tool.slug, tool.category) : [];
  const canonicalUrl = tool ? `${siteUrl}${tool.href}` : siteUrl;
  const breadcrumbJsonLd =
    tool && category
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
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
  const toolJsonLd =
    tool && category
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.title,
          applicationCategory: `${category.title} Application`,
          operatingSystem: "Web",
          description,
          url: canonicalUrl,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }
      : null;
  const faqJsonLd =
    seoContent?.faq?.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: seoContent.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
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
              __html: JSON.stringify([breadcrumbJsonLd, toolJsonLd, faqJsonLd].filter(Boolean)),
            }}
          />
        ) : null}

        <div className="mx-auto max-w-3xl text-center">
          {category ? (
            <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <Link href="/" className="hover:text-[var(--accent-700)]">
                Home
              </Link>
              <span>/</span>
              <Link href={category.href} className="hover:text-[var(--accent-700)]">
                {category.title}
              </Link>
              <span>/</span>
              <span className="font-medium text-[var(--ink-900)]">{title}</span>
            </nav>
          ) : null}
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>

        {children}

        {seoContent ? (
          <ContentSection
            eyebrow={eyebrow}
            title={`About ${title}`}
            intro={seoContent.intro}
            highlights={seoContent.highlights}
            useCases={seoContent.useCases}
            faq={seoContent.faq}
          />
        ) : null}

        {relatedTools.length ? <RelatedTools tools={relatedTools} /> : null}
      </Container>
    </section>
  );
}
