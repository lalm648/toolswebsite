"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  items: FAQItem[];
  intro?: string;
};

export default function FAQSection({ items, intro }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto w-full max-w-[940px]" aria-labelledby="faq-heading">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">FAQ</p>
        <h2 id="faq-heading" className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Common questions
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
          {intro ?? "Everything you need to know before processing your files."}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
        {items.map((item, index) => {
          const open = openIndex === index;
          const triggerId = `faq-trigger-${index}`;
          const panelId = `faq-panel-${index}`;
          return (
            <div
              key={item.question}
              className={`overflow-hidden transition-colors ${index < items.length - 1 ? "border-b border-[var(--outline-soft)]" : ""} ${open ? "bg-[var(--surface-panel)]" : ""}`}
            >
              <button
                id={triggerId}
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--ring-soft)] sm:px-6"
              >
                <span className={`text-[15px] text-[var(--ink-900)] ${open ? "font-bold" : "font-semibold"}`}>{item.question}</span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-raised)] text-[var(--accent-700)] shadow-[var(--shadow-soft)] transition-transform duration-200 ${
                    open ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!open}
                className={`grid transition-all duration-200 ease-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-7 text-[var(--muted-foreground)] sm:px-6 sm:pb-6">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
