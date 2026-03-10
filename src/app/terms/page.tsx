import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Terms | ToolsWebsite",
  "Read the terms for using ToolsWebsite."
);

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Terms</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          These terms pages are part of the shell and trust layer the project needs before scaling
          out tool pages.
        </p>
      </Container>
    </section>
  );
}
