import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { categories, getToolsByCategory } from "@/lib/data/tools";

/**
 * Without this, a stale or mistyped URL rendered Next's bare default page — no header,
 * no footer, no links out. A crawler hitting an old URL got a dead end, and so did a
 * visitor. Noindex because a 404 should never be indexed.
 */
export const metadata: Metadata = {
  title: "Page not found | Webutilia",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="py-[var(--space-section)] sm:py-[var(--space-section-lg)]">
      <Container className="space-y-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-sm font-semibold tracking-[0.18em] text-[var(--accent-700)]">
            404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            We could not find that page
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
            The link may be out of date, or the address may have a typo. Every tool is
            still here — pick a category below, or start from the home page.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Go to the home page</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/#tool-library">Browse all tools</Link>
            </Button>
          </div>
        </div>

        <nav
          aria-label="Tool categories"
          className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="flex min-h-14 flex-col justify-center rounded-[var(--radius-md)] border border-[var(--outline-soft)] bg-[var(--surface-card)] px-4 py-3 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-[var(--outline-strong)] hover:bg-[var(--surface-card-hover)]"
            >
              <span className="text-sm font-semibold text-[var(--ink-900)]">
                {category.title}
              </span>
              <span className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {getToolsByCategory(category.slug).length} tools
              </span>
            </Link>
          ))}
        </nav>
      </Container>
    </section>
  );
}
