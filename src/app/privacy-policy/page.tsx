import type { Metadata } from "next";
import Container from "@/components/Container";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata(
  "Privacy Policy | ToolsWebsite",
  "Read the privacy policy for ToolsWebsite."
);

export default function PrivacyPolicyPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Privacy Policy</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            ToolsWebsite is designed to keep as much processing as possible inside your browser. This
            policy explains what data may still be collected when you browse the site or opt into analytics.
          </p>
        </div>

        <div className="space-y-6 rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Browser-side processing</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Most text and image transformations on ToolsWebsite run locally in your browser. In those
              cases, the content you paste or the files you upload are not intentionally transmitted to our server.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Analytics and consent</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              If you accept analytics, ToolsWebsite may collect privacy-conscious usage information such
              as page views, search interactions, tool opens, and CTA clicks. This helps us understand
              which pages are useful and where improvements are needed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Contact information</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              If you contact us by email, we receive the information you choose to send, such as your
              name, email address, topic, and message. We use this only to respond to your request and
              operate the website.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Third-party services</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              ToolsWebsite may later use third-party providers for analytics, advertising, newsletters,
              forms, or sponsorship inquiries. When those services are added, this policy should be
              updated to reflect the provider, the purpose, and the data involved.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--ink-900)]">Your choices</h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              You can decline non-essential analytics through the consent banner. You can also avoid
              using tools that involve browser-side processing if you do not want your content handled locally.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
