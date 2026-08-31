"use client";

/*
  The category grid is rendered by the home page and by every category route, so
  its density sets how much of the catalogue a visitor can see at once. The
  paragraph card it used to render fitted three categories on a laptop screen;
  the tile fits all ten.

  Motion lives here rather than in CategoryTile so the tile stays a plain server
  component that any surface can render.
*/

import { motion, useReducedMotion } from "motion/react";
import CategoryTile from "@/components/visual/CategoryTile";
import { tools, type CategoryDefinition } from "@/lib/data/tools";

type CategoryGridProps = {
  categories: CategoryDefinition[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => {
        const toolCount = tools.filter((tool) => tool.category === category.slug).length;

        return (
          <motion.div
            key={category.slug}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            whileTap={reduceMotion ? undefined : { y: -1, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.55 }}
          >
            <CategoryTile category={category} toolCount={toolCount} />
          </motion.div>
        );
      })}
    </div>
  );
}
