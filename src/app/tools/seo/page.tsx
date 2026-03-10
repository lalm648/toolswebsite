import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "SEO Tools | ToolsWebsite",
  "Browse SEO tools on ToolsWebsite."
);

export default function SeoToolsPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          SEO Tools
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          This category page is in place. Individual SEO tool routes come next.
        </p>
      </Container>
    </section>
  );
}
