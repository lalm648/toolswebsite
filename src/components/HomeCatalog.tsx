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
  { id: "popular", label: "Recommended" },
  { id: "image", label: "Image" },
  { id: "document", label: "PDF" },
  { id: "video", label: "Video" },
  { id: "audio", label: "Audio" },
  { id: "developer", label: "Developer" },
  { id: "security", label: "Security" },
  { id: "all", label: "All Tools" },
] as const;

const featuredBadges: Record<string, string> = {
  "image-compressor": "Most used",
  "pdf-merger": "No upload",
  "background-remover": "Local",
  "video-compressor": "Private",
};

export default function HomeCatalog() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("popular");

  const featuredTools = useMemo(() => getFeaturedTools(), []);
  const popularTools = useMemo(() => getPopularTools(), []);
  const popularDirectoryTools = useMemo(
    () => popularTools.filter((tool) => !featuredTools.some((featured) => featured.slug === tool.slug)),
    [featuredTools, popularTools],
  );
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
    if (activeTab === "popular") return popularDirectoryTools;
    if (activeTab === "all") return tools;
    return tools.filter((tool) => tool.category === activeTab);
  }, [searching, searchResults, activeTab, popularDirectoryTools]);

  const suggestions = searching ? searchResults.slice(0, 5) : [];

  return (
    <>
      <section className="pb-2 pt-4 text-center sm:pt-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" />
          {tools.length} focused tools · no sign-up
        </span>
        <h1 className="mx-auto mt-5 max-w-4xl text-[clamp(2.4rem,6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.045em] text-[var(--ink-900)]">
          Every tool you need, right in your browser
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
          Convert, compress, edit and manage files securely — without installing anything.
        </p>

        <div className="relative z-10 mt-7">
          <SearchBar
            value={query}
            onChange={setQuery}
            size="lg"
            placeholder={`Search ${tools.length}+ tools…`}
            analyticsSource="home_catalog"
          />
          {searching ? (
            <div
              aria-live="polite"
              className="mx-auto mt-2 max-w-[720px] overflow-hidden rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-2 text-left shadow-[var(--shadow-soft)]"
            >
              <p className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">
                {searchResults.length
                  ? `${searchResults.length} matching ${searchResults.length === 1 ? "tool" : "tools"}`
                  : "No matching tools"}
              </p>
              {suggestions.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex min-h-11 items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-sm hover:bg-[var(--accent-50)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
                >
                  <span>
                    <span className="font-semibold text-[var(--ink-900)]">{tool.title}</span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">{tool.meta}</span>
                  </span>
                  <span className="text-[var(--accent-700)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Try</span>
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline-strong)] underline-offset-4 hover:text-[var(--accent-700)] hover:decoration-[var(--accent-500)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            >
              {shortcut.label}
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--outline-soft)] pt-4 text-xs font-semibold text-[var(--muted-foreground)] sm:text-sm">
          {["Runs in your browser", "No account required", "Files stay on your device where supported"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-[10px] text-emerald-700" aria-hidden="true">✓</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="pt-8 sm:pt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Categories</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Browse by workflow
          </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">Start with the kind of task you need, then choose a focused tool.</p>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {!searching ? (
        <section className="pt-10 sm:pt-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Curated</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">Popular right now</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">Four reliable starting points for common workflows.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} variant="featured" badge={featuredBadges[tool.slug]} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="tool-library" className="mt-10 scroll-mt-24 rounded-[var(--radius-lg)] bg-[var(--surface-panel)] px-4 py-7 sm:mt-12 sm:px-7 sm:py-9">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-700)]">Tool library</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
              {searching ? "Search results" : "Find a tool quickly"}
            </h2>
          </div>
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Showing {gridTools.length} of {tools.length}</p>
        </div>

        {!searching ? (
          <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Filter tools by category">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${
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
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--outline-strong)] bg-[var(--surface-card)] px-6 py-3 text-sm font-semibold text-[var(--ink-900)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-500)] hover:text-[var(--accent-700)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
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
