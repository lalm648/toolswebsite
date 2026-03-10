import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "About | ToolsWebsite",
  "Learn what ToolsWebsite is building and why the shell comes before tool logic."
);

export default function AboutPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">About</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          This project is being built as a structured tools website with reusable pages,
          categories, and components first so future utilities can be added without rebuilding the app.
        </p>
      </Container>
    </section>
  );
}
