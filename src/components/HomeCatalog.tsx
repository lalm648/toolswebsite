"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategoryGrid from "@/components/CategoryGrid";
import SearchBar from "@/components/SearchBar";
import ToolCard from "@/components/tool/ToolCard";
import ToolsEmptyState from "@/components/tool/ToolsEmptyState";
import {
  categories,
  getFeaturedTools,
  getPopularTools,
  tools,
} from "@/lib/data/tools";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const shortcuts = [
  { label: "Compress Image", href: "/tools/image/image-compressor" },
  { label: "PDF Tools", href: "/tools/document" },
  { label: "Remove Background", href: "/tools/image/background-remover" },
  { label: "JSON Formatter", href: "/tools/developer/json-formatter" },
];

const tabs = [
  { id: "popular", label: "Popular" },
  { id: "image", label: "Image" },
  { id: "document", label: "PDF" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "developer", label: "Developer" },
  { id: "security", label: "Security" },
  { id: "all", label: "All Tools" },
] as const;

export default function HomeCatalog() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("popular");

  const featuredTools = useMemo(() => getFeaturedTools(), []);
  const popularTools = useMemo(() => getPopularTools(), []);
  const searching = normalize(query).length > 0;

  const searchResults = useMemo(() => {
    const normalized = normalize(query);
    if (!normalized) return [];
    return tools.filter((tool) =>
      [tool.title, tool.description, tool.meta, tool.category].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  const gridTools = useMemo(() => {
    if (searching) return searchResults;
    if (activeTab === "popular") return popularTools;
    if (activeTab === "all") return tools;
    return tools.filter((tool) => tool.category === activeTab);
  }, [searching, searchResults, activeTab, popularTools]);

  return (
    <>
      {/* Hero — open on the page background, search as the primary action */}
      <section className="pb-4 pt-8 text-center sm:pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" />
          {tools.length}+ free tools · files stay on your device
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-[var(--ink-900)] sm:text-5xl md:text-[3.25rem]">
          Every tool you need, right in your browser
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
          Convert, compress, edit and manage files securely — without installing anything.
        </p>

        <div className="mt-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            size="lg"
            placeholder={`Search ${tools.length}+ tools…`}
            analyticsSource="home_catalog"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-500)] hover:text-[var(--accent-700)]"
            >
              {shortcut.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories — open, no outer container */}
      <section className="pt-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Categories</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Browse by workflow
          </h2>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {/* Featured + tool library — subtle tinted section for tonal rhythm */}
      <section className="mt-14 rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-4 py-10 sm:px-8 sm:py-12">
        {!searching ? (
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Most used</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
              Featured tools
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} variant="featured" badge="Popular" />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Tool library</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
              {searching ? "Search results" : "Find a tool quickly"}
            </h2>
          </div>
          {!searching ? (
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Showing {gridTools.length} of {tools.length}
            </p>
          ) : null}
        </div>

        {!searching ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${
                    active
                      ? "bg-[var(--accent-500)] text-white"
                      : "border border-[var(--outline-soft)] bg-[var(--surface-card)] text-[var(--muted-foreground)] hover:border-[var(--outline-strong)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {gridTools.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <ToolsEmptyState query={query} />
          </div>
        )}

        {!searching && activeTab === "popular" ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-strong)] bg-[var(--surface-card)] px-6 py-3 text-sm font-semibold text-[var(--ink-900)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-500)] hover:text-[var(--accent-700)]"
            >
              View all {tools.length} tools
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
