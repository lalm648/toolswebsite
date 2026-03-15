import Container from "@/components/Container";
import HomeCatalog from "@/components/HomeCatalog";
import NewsletterSignup from "@/components/lead/NewsletterSignup";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import RevealOnScroll from "@/components/RevealOnScroll";
import CTABlock from "@/components/tool/CTABlock";
import FAQSection from "@/components/tool/FAQSection";
import { siteFlags } from "@/lib/site-flags";

export default function Home() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-14">
        <HomeCatalog />

        <FAQSection
          items={[
            {
              question: "What is complete now?",
              answer: "You can already use browser-based tools for common image, text, developer, and SEO tasks.",
            },
            {
              question: "What comes next?",
              answer: "The next improvements are deeper tool coverage, more edge-case handling, and stronger QA.",
            },
            {
              question: "Do I need to sign up to use the tools?",
              answer: "No. The core browser tools are available without creating an account, which keeps simple tasks fast and accessible."
            },
          ]}
        />

        {siteFlags.showNewsletterSignup || siteFlags.showWaitlistBlock ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {siteFlags.showNewsletterSignup ? (
              <RevealOnScroll>
                <NewsletterSignup source="homepage" />
              </RevealOnScroll>
            ) : null}

            {siteFlags.showWaitlistBlock ? (
              <RevealOnScroll>
                <WaitlistBlock
                  source="homepage"
                  title="Get on the waitlist for premium tools"
                  description="Register early interest for pro browser workflows, advanced exports, sponsor packages, and future paid utility bundles."
                />
              </RevealOnScroll>
            ) : null}
          </div>
        ) : null}

        <CTABlock
          title="Browse the full tool library"
          description="Start with image, text, developer, or SEO utilities built to run directly in your browser."
          href="/tools/image"
          label="Explore tools"
        />
      </Container>
    </section>
  );
}
