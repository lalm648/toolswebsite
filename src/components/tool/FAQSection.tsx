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
    <section className="mx-auto w-full max-w-[860px]">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Common questions
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
          {intro ?? "Everything you need to know before processing your files."}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.question}
              className={`overflow-hidden rounded-[var(--radius-md)] border bg-[var(--surface-card)] transition-colors ${
                open ? "border-[var(--outline-strong)]" : "border-[var(--outline-soft)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
              >
                <span className="text-[15px] font-semibold text-[var(--ink-900)]">{item.question}</span>
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--outline-soft)] text-[var(--accent-700)] transition-transform duration-200 ${
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
                className={`grid transition-all duration-200 ease-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-7 text-[var(--muted-foreground)]">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
