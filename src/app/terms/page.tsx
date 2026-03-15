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
      <Container className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Terms</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            These terms describe the basic conditions for using ToolsWebsite and its browser-based utilities.
          </p>
        </div>

        <div className="space-y-6 rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Use at your own discretion</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              ToolsWebsite is provided on an as-is basis. We aim for useful and reliable tools, but we
              cannot guarantee uninterrupted service, perfect output, or suitability for every workflow.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Content and files</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              You are responsible for the content, files, and data you process through the site. Make
              sure you have the rights and permission to use that material.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">No professional advice</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              The website provides utility tools and informational output. It does not constitute legal,
              financial, security, medical, or professional advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Future monetization</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              ToolsWebsite may later include advertising, sponsorships, affiliate links, newsletter
              forms, or premium offerings. When those features are introduced, the terms and privacy
              policy should be updated accordingly.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Liability limits</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              To the maximum extent allowed by law, ToolsWebsite is not liable for direct or indirect
              loss arising from reliance on the site, tool output, downtime, or third-party integrations.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
