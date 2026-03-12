import Container from "@/components/Container";
import HomeCatalog from "@/components/HomeCatalog";
import CTABlock from "@/components/tool/CTABlock";
import FAQSection from "@/components/tool/FAQSection";

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
          ]}
        />

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
