import FAQSection from "@/components/tool/FAQSection";

type ContentSectionProps = {
  eyebrow: string;
  title: string;
  intro: string[];
  highlights: string[];
  useCases?: string[];
  faq?: Array<{ question: string; answer: string }>;
};

export default function ContentSection({
  eyebrow,
  title,
  intro,
  highlights,
  useCases = [],
  faq = [],
}: ContentSectionProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-3xl">{title}</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item}
              className="rounded-[1.1rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--foreground)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {useCases.length ? (
        <section className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Common use cases</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item}
                className="rounded-[1.1rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {faq.length ? <FAQSection items={faq} /> : null}
    </div>
  );
}
