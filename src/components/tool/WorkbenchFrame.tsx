"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ToolCategorySlug } from "@/lib/data/tools";

type WorkbenchFrameProps = {
  category?: ToolCategorySlug;
  children: ReactNode;
};

const stages = ["Input", "Process", "Output"];

export default function WorkbenchFrame({ category, children }: WorkbenchFrameProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="tool-workbench-frame" data-category={category} aria-label="Tool workspace">
      <span className="workbench-orb workbench-orb-one" aria-hidden="true" />
      <span className="workbench-orb workbench-orb-two" aria-hidden="true" />

      <div className="workbench-flow" aria-label="Input, process, and output workflow">
        {stages.map((stage, index) => (
          <div className="workbench-flow-step" key={stage}>
            <span className="workbench-flow-index" aria-hidden="true">{index + 1}</span>
            <span className="min-w-0 text-xs font-bold text-[var(--ink-900)]">{stage}</span>
          </div>
        ))}
      </div>

      <motion.div
        className="tool-workbench-content"
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 24, mass: 0.7 }}
      >
        {children}
      </motion.div>
    </section>
  );
}
