import type { Metadata } from "next";
import Container from "@/components/Container";
import ContentSection from "@/components/seo/ContentSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "About | ToolsWebsite",
  "Learn what ToolsWebsite offers across image, text, developer, and SEO workflows, and how the site is built for browser-first utility work.",
  {
    path: "/about",
    category: "About",
    keywords: [
      "about toolswebsite",
      "browser tools website",
      "image text developer seo tools",
      "online productivity tools",
    ],
  }
);

export default function AboutPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-5xl space-y-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">About ToolsWebsite</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            ToolsWebsite is a browser-first tools library built for practical work across image editing,
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
              question: "Is ToolsWebsite only for one type of user?",
              answer: "No. The site is designed for a broad working audience including marketers, writers, store owners, developers, operations teams, editors, and independent site builders."
            }
          ]}
        />
      </Container>
    </section>
  );
}
