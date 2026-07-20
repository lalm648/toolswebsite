import Container from "@/components/Container";
import CompleteToolIndex from "@/components/CompleteToolIndex";
import HomeCatalog from "@/components/HomeCatalog";
import NewsletterSignup from "@/components/lead/NewsletterSignup";
import WaitlistBlock from "@/components/lead/WaitlistBlock";
import RevealOnScroll from "@/components/RevealOnScroll";
import CTABlock from "@/components/tool/CTABlock";
import FAQSection from "@/components/tool/FAQSection";
import { categories, tools } from "@/lib/data/tools";
import { siteUrl } from "@/lib/seo/metadata";
import { siteFlags } from "@/lib/site-flags";
import HomeSeoContent from "@/components/seo/HomeSeoContent";

const homeFaq = [
  {
    question: "Are the online tools free to use?",
    answer: `Yes. The core library includes ${tools.length} free browser tools with no account required.`,
  },
  {
    question: "Do my files upload to a server?",
    answer: "Image, media, document, text, and developer workflows run locally when browser technology supports the operation. Public website and network diagnostics use protected server requests because browsers cannot perform those checks directly.",
  },
  {
    question: "Do I need to sign up to use the tools?",
    answer: "No. The core browser tools are available without creating an account, which keeps simple tasks fast and accessible.",
  },
  {
    question: "Can I use these tools on a phone or tablet?",
    answer: "The interface is responsive and works in modern mobile browsers. Very large media files may process faster on a desktop device with more memory and processing power.",
  },
];

export default function Home() {
  const homeJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: homeFaq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${siteUrl}/#categories`,
      name: "Webutilia categories",
      numberOfItems: categories.length,
      itemListElement: categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.title,
        item: `${siteUrl}${category.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${siteUrl}/#webpage`,
      name: "Free online browser tools",
      url: siteUrl,
      description: "Use free online tools for images, PDFs, video, audio, text, development, security, SEO, and public web diagnostics.",
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl}/#website` },
      publisher: { "@id": `${siteUrl}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        "@id": `${siteUrl}/#tools`,
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          item: `${siteUrl}${tool.href}`,
        })),
      },
    },
  ];

  return (
    <section className="py-9 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
      />
      <Container className="space-y-10 sm:space-y-12">
        <HomeCatalog />

        <CompleteToolIndex />

        <HomeSeoContent />

        <FAQSection items={homeFaq} />

        {siteFlags.showNewsletterSignup || siteFlags.showWaitlistBlock ? (
          <section id="premium" aria-labelledby="premium-heading" className="scroll-mt-24 rounded-[var(--radius-lg)] bg-[var(--surface-panel)] p-5 sm:p-7">
            <div className="mb-6 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Stay in the loop</p>
              <h2 id="premium-heading" className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)]">Early access and useful product updates</h2>
            </div>
            <div className="grid gap-7 divide-y divide-[var(--outline-soft)] xl:grid-cols-2 xl:divide-x xl:divide-y-0">
            {siteFlags.showWaitlistBlock ? (
              <RevealOnScroll className="xl:pr-7">
                <WaitlistBlock
                  source="homepage"
                  compact
                  title="Get on the waitlist for premium tools"
                  description="Register early interest for larger file limits, batch processing, an ad-free experience, priority processing, and advanced tools built for power users."
                />
              </RevealOnScroll>
            ) : null}

            {siteFlags.showNewsletterSignup ? (
              <RevealOnScroll className="pt-7 xl:pl-7 xl:pt-0">
                <NewsletterSignup source="homepage" compact />
              </RevealOnScroll>
            ) : null}
            </div>
          </section>
        ) : null}

        <CTABlock
          title="Still looking for something?"
          description={`Explore all ${tools.length} image, PDF, video, audio, developer, and security tools — free and running in your browser.`}
          href="#tool-library"
          label="Browse all tools"
        />
      </Container>
    </section>
  );
}
