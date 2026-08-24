"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

type ToolResultProps = {
  title: string;
  isProcessing?: boolean;
  processingLabel?: string;
  children: ReactNode;
};

export default function ToolResult({
  title,
  isProcessing = false,
  processingLabel = "Updating preview",
  children,
}: ToolResultProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="h-full"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
    >
      <Card className={`h-full bg-[var(--surface-raised)] ${isProcessing ? "motion-shimmer" : ""}`}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] text-[var(--accent-700)] shadow-[var(--shadow-soft)]" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 7.5h14v11H5z" />
                  <path d="m8 4.5 4 3 4-3" />
                  <path d="M9 12h6M9 15h4" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">Result surface</p>
                <h2 className="mt-0.5 text-lg font-semibold text-[var(--ink-900)]">{title}</h2>
              </div>
            </div>
            {isProcessing ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-50)] px-3 py-1 text-xs font-semibold text-[var(--accent-700)]">
                <span className="motion-status-dot h-2 w-2 rounded-full bg-current" />
                <span>{processingLabel}</span>
              </p>
            ) : null}
          </div>
          <div className="mt-4">{children}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
