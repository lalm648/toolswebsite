import Container from "@/components/Container";
import HomeCatalog from "@/components/HomeCatalog";
import NewsletterSignup from "@/components/lead/NewsletterSignup";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import RevealOnScroll from "@/components/RevealOnScroll";
import CTABlock from "@/components/tool/CTABlock";
import FAQSection from "@/components/tool/FAQSection";
import { categories, tools } from "@/lib/data/tools";
import { siteUrl } from "@/lib/seo/metadata";
import { siteFlags } from "@/lib/site-flags";

export default function Home() {
  const homeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToolsWebsite",
      url: siteUrl,
      description: "Free browser-based tools for images, text, SEO, and developer workflows.",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "ToolsWebsite categories",
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.title,
        url: `${siteUrl}${category.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Free online browser tools",
      url: siteUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: `${siteUrl}${tool.href}`,
        })),
      },
    },
  ];

  return (
    <section className="py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
      />
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
          <div id="premium" className="grid scroll-mt-24 gap-5 xl:grid-cols-2">
            {siteFlags.showWaitlistBlock ? (
              <RevealOnScroll>
                <WaitlistBlock
                  source="homepage"
                  title="Get on the waitlist for premium tools"
                  description="Register early interest for larger file limits, batch processing, an ad-free experience, priority processing, and advanced tools built for power users."
                />
              </RevealOnScroll>
            ) : null}

            {siteFlags.showNewsletterSignup ? (
              <RevealOnScroll>
                <NewsletterSignup source="homepage" />
              </RevealOnScroll>
            ) : null}
          </div>
        ) : null}

        <CTABlock
          title="Still looking for something?"
          description={`Explore all ${tools.length} image, PDF, video, audio, developer, and security tools — free and running in your browser.`}
          href="/"
          label="Browse all tools"
        />
      </Container>
    </section>
  );
}
