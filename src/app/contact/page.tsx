import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Contact | ToolsWebsite",
  "Contact ToolsWebsite to request a tool or share a workflow."
);

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Contact
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          This is the trust page for support, requests, and future feature intake.
        </p>
      </Container>
    </section>
  );
}
