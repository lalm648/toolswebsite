import type { Metadata } from "next";
import Container from "@/components/Container";
import ContactForm from "@/components/ContactForm";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Contact | ToolsWebsite",
  "Contact ToolsWebsite to request a tool or share a workflow."
);

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-5xl space-y-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Contact</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Reach out with tool requests, bug reports, partnership inquiries, sponsorship discussions,
            or feedback about your workflow.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <ContactForm />

          <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">What to include</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
              <p>For bug reports: include the tool name, browser, device, and the exact action that caused the issue.</p>
              <p>For tool requests: describe the workflow, your input format, and the output you expect.</p>
              <p>For partnerships or ads: share the campaign goal, target geography, and preferred placement.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
