import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Text Tools | ToolsWebsite",
  "Browse text tools on ToolsWebsite."
);

export default function TextToolsPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Text Tools
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          This category page is in place. Individual text tool routes come next.
        </p>
      </Container>
    </section>
  );
}
