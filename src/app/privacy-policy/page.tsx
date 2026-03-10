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
      <Container className="max-w-4xl">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Browser-first tools reduce the need to send user content to a server. This page gives the
          site a proper privacy surface early.
        </p>
      </Container>
    </section>
  );
}
