import Link from "next/link";
import FAQSection from "@/components/tool/FAQSection";
import type { SeoLink } from "@/lib/seo/links";

type ContentSectionProps = {
  eyebrow: string;
  title: string;
  intro: string[];
  highlights: string[];
  useCases?: string[];
  steps?: Array<{ name: string; text: string }>;
  tips?: string[];
  internalLinks?: SeoLink[];
  externalLinks?: SeoLink[];
  faq?: Array<{ question: string; answer: string }>;
  compact?: boolean;
};

export default function ContentSection({
  eyebrow,
  title,
  intro,
  highlights,
  useCases = [],
  steps = [],
  tips = [],
  internalLinks = [],
  externalLinks = [],
  faq = [],
  compact = false,
}: ContentSectionProps) {
  return (
    <div className={compact ? "space-y-6" : "space-y-8"}>
      <section className={`rounded-[var(--radius-xl)] ${compact ? "bg-[var(--surface-panel)] p-5 sm:p-6" : "border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7"}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-3xl">{title}</h2>
        <div className={`mt-4 text-sm text-[var(--muted-foreground)] sm:text-base ${compact ? "grid gap-3 leading-6 lg:grid-cols-2" : "space-y-4 leading-7"}`}>
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className={`${compact ? "mt-5" : "mt-6"} grid gap-3 sm:grid-cols-3`}>
          {highlights.map((item) => (
            <div
              key={item}
              className={`rounded-[var(--radius-lg)] bg-[var(--surface-raised)] text-sm leading-6 text-[var(--foreground)] ${compact ? "p-3 shadow-[var(--shadow-soft)]" : "border border-[var(--outline-soft)] p-4"}`}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {useCases.length ? (
        <section className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Common use cases</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item}
                className="rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {steps.length ? (
        <section className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">Step-by-step</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">How to use this tool</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li id={`step-${index + 1}`} key={step.name} className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--action-bg)] text-sm font-bold text-[var(--action-fg)]">{index + 1}</span>
                <h3 className="mt-4 font-semibold text-[var(--ink-900)]">{step.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {tips.length ? (
        <section className="rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-6 sm:p-7">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Tips for a better result</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-6 text-[var(--foreground)]">
                <span aria-hidden="true" className="mt-1 text-[var(--accent-600)]">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {internalLinks.length || externalLinks.length ? (
        <section className="grid gap-5 lg:grid-cols-2" aria-label="Helpful links and references">
          {internalLinks.length ? (
            <div className={`rounded-[var(--radius-xl)] bg-[var(--surface-card)] ${compact ? "p-5 shadow-[var(--shadow-soft)]" : "border border-[var(--outline-soft)] p-6 sm:p-7"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">Keep working</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Related workflows</h2>
              <div className="mt-5 grid gap-3">
                {internalLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={`group rounded-[var(--radius-md)] p-4 hover:bg-[var(--accent-50)] ${compact ? "bg-[var(--surface-panel)]" : "border border-[var(--outline-soft)] hover:border-[var(--accent-300)]"}`}>
                    <span className="font-semibold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">{link.label} <span aria-hidden="true">→</span></span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">{link.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {externalLinks.length ? (
            <div className={`rounded-[var(--radius-xl)] bg-[var(--surface-card)] ${compact ? "p-5 shadow-[var(--shadow-soft)]" : "border border-[var(--outline-soft)] p-6 sm:p-7"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">Learn from primary sources</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--ink-900)]">Trusted references</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">Use these standards and official guides when you need deeper technical detail.</p>
              <div className="mt-5 grid gap-3">
                {externalLinks.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={`group rounded-[var(--radius-md)] p-4 hover:bg-[var(--accent-50)] ${compact ? "bg-[var(--surface-panel)]" : "border border-[var(--outline-soft)] hover:border-[var(--accent-300)]"}`}>
                    <span className="font-semibold text-[var(--ink-900)] group-hover:text-[var(--accent-700)]">{link.label} <span className="sr-only">(opens in a new tab)</span><span aria-hidden="true">↗</span></span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">{link.description}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {faq.length ? <FAQSection items={faq} /> : null}
    </div>
  );
}
