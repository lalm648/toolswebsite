"use client";

import { useMemo, useState } from "react";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ToolsSection from "@/components/tool/ToolsSection";
import { Card, CardContent } from "@/components/ui/card";
import { categories, tools } from "@/lib/data/tools";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function HomeCatalog() {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const normalized = normalize(query);

    if (!normalized) {
      return categories;
    }

    return categories.filter((category) =>
      [category.title, category.description, category.slug, category.eyebrow, category.badge].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [query]);

  const filteredTools = useMemo(() => {
    const normalized = normalize(query);

    if (!normalized) {
      return tools;
    }

    return tools.filter((tool) =>
      [tool.title, tool.description, tool.meta, tool.category].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [query]);

  return (
    <>
      <Card className="rounded-3xl bg-[var(--surface-hero)]">
        <CardContent className="px-6 py-12 text-center sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" />
            {tools.length} free tools · nothing uploaded to a server
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            Every tool you need for image, text &amp; developer work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
            Convert images, clean text, format JSON, and generate SEO tags — all running privately in
            your browser.
          </p>
          <div className="mt-8">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search tools like JPG to WebP, word counter, or JSON formatter"
              analyticsSource="home_catalog"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted-foreground)]">
            {["100% in-browser", "No sign-up", "Free forever", "No file limits"].map((chip) => (
              <span key={chip} className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[var(--accent-500)]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {chip}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink-900)]">Browse categories</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              Start from a workflow area, then drill into a specific tool.
            </p>
          </div>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            {filteredCategories.length} categor{filteredCategories.length === 1 ? "y" : "ies"}
          </p>
        </div>

        {filteredCategories.length ? (
          <CategoryGrid categories={filteredCategories} />
        ) : (
          <Card className="border-dashed border-[var(--outline-strong)] bg-[var(--surface-panel)]">
            <CardContent className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-[var(--brand-600)]">No categories match “{query}”</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                Try searching by broader terms like image, text, developer, or SEO.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
        <ToolsSection
          title="Find a tool quickly"
          description="Search across the tool library by name, workflow, or category."
          tools={filteredTools}
          query={query}
        />
      </div>
    </>
  );
}
