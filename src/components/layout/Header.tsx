"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Container from "@/components/Container";
import ThemeToggle from "@/components/layout/ThemeToggle";

const links = [
  { href: "/tools/image", label: "Image" },
  { href: "/tools/text", label: "Text" },
  { href: "/tools/developer", label: "Developer" },
  { href: "/tools/seo", label: "SEO" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outline-soft)] bg-[var(--header-bg)] backdrop-blur-xl">
      <Container className="py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-xl font-semibold tracking-tight text-[var(--ink-900)]">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--accent-500),var(--brand-500))] text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
              TW
            </span>
            <span className="truncate text-base sm:text-lg">ToolsWebsite</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav className="flex items-center gap-2">
              {links.map((link) => {
                const isActive = isActiveLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${
                      isActive
                        ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)] shadow-[var(--shadow-soft)]"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
                {isMobileMenuOpen ? (
                  <>
                    <path d="M6 6 18 18" />
                    <path d="M18 6 6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div
            id="mobile-navigation"
            className="mt-3 rounded-[1.4rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-lift)] md:hidden"
          >
            <nav className="grid gap-2">
              {links.map((link) => {
                const isActive = isActiveLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`rounded-[1rem] px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-panel)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </Container>
    </header>
  );
}
