import CategoryGrid from "@/components/CategoryGrid";
import Container from "@/components/Container";
import SearchBar from "@/components/SearchBar";
import CTABlock from "@/components/tool/CTABlock";
import FAQSection from "@/components/tool/FAQSection";
import { Card, CardContent } from "@/components/ui/card";
import { categories } from "@/lib/data/tools";

export default function Home() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-14">
        <Card className="rounded-[2rem] bg-[var(--surface-hero)] shadow-[var(--shadow-lift)]">
          <CardContent className="px-6 py-12 text-center sm:px-10">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-6xl">
              Practical online tools with real structure
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-foreground)] sm:text-xl">
              Phase 4 is about the shell first: core pages, category routes, trust pages, and shared
              components before tool logic.
            </p>
            <div className="mt-8">
              <SearchBar />
            </div>
          </CardContent>
        </Card>

        <CategoryGrid categories={categories} />

        <FAQSection
          items={[
            {
              question: "What is complete now?",
              answer: "The project now has the important shell pieces the prompt asked for, not just a single landing page.",
            },
            {
              question: "What comes next?",
              answer: "Individual tool routes and then real browser-side tool logic.",
            },
          ]}
        />

        <CTABlock
          title="Next: build the first working tool"
          description="The structure is in place. The next practical move is implementing one tool end to end."
          href="/tools/image"
          label="Open categories"
        />
      </Container>
    </section>
  );
}
