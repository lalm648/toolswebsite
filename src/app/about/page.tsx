import type { Metadata } from "next";
import Container from "@/components/Container";
import ContentSection from "@/components/seo/ContentSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "About | Webutilia",
  "Learn what Webutilia offers across image, text, developer, and SEO workflows, and how the site is built for browser-first utility work.",
  {
    path: "/about",
    category: "About",
  }
);

export default function AboutPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-5xl space-y-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-5xl">About Webutilia</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--muted-foreground)]">
            Webutilia is a browser-first tools library built for practical work across image editing,
            text cleanup, developer utilities, and SEO preparation. The goal is simple: make recurring
            utility tasks faster without forcing users into heavy software or unnecessary uploads.
          </p>
        </div>

        <ContentSection
          eyebrow="Platform overview"
          title="What the site covers from A to Z"
          intro={[
            "The image tools focus on everyday media production tasks such as format conversion, resizing, compression, cropping, and rotation. These are the kinds of steps teams repeat while preparing assets for websites, marketplaces, social campaigns, and product pages.",
            "The text tools are built for cleanup and transformation. They help when copied content is messy, duplicated, wrapped strangely, or needs a fast formatting change before it can be reused in a CMS, document, or workflow.",
            "The developer section covers lightweight utilities that help with encoded values and structured payloads. The SEO section focuses on page-level metadata, social preview tags, canonicals, and structured output that support stronger publishing workflows."
          ]}
          highlights={[
            "Image tools for conversion, editing, compression, and web preparation.",
            "Text tools for counting, cleanup, formatting, and quick content preparation.",
            "Developer and SEO tools for payload handling, metadata generation, and technical publishing work."
          ]}
          useCases={[
            "Publishing and marketing teams preparing content faster",
            "Developers and QA teams checking payloads and encoded values",
            "Site owners improving metadata, previews, and page readiness"
          ]}
          faq={[
            {
              question: "Why build the site around browser-first tools?",
              answer: "Browser-first utilities reduce friction for small, repeated tasks and help users move faster without installing extra software or handing simple jobs off to heavier systems."
            },
            {
              question: "Is Webutilia only for one type of user?",
              answer: "No. The site is designed for a broad working audience including marketers, writers, store owners, developers, operations teams, editors, and independent site builders."
            }
          ]}
        />

        <section className="border-y border-[var(--outline-soft)] py-8 sm:py-10" aria-labelledby="review-method-heading">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-700)]">How Webutilia is reviewed</p>
          <h2 id="review-method-heading" className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-3xl">Claims follow the working tool</h2>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-[var(--muted-foreground)] sm:grid-cols-2 sm:text-base">
            <p>Each tool page is checked against its actual inputs, limits, processing path, preview, and final action. Copy is updated when formats or controls change, so the page does not promise an option the interface cannot deliver.</p>
            <p>Local-processing claims are used only for workflows that run in the browser. Public website and network checks identify their protected server request because a browser cannot directly perform those diagnostics.</p>
          </div>
        </section>
      </Container>
    </section>
  );
}
