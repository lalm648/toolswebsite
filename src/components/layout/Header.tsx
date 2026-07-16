"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Container from "@/components/Container";
import ThemeToggle from "@/components/layout/ThemeToggle";

const desktopLinks = [
  { href: "/tools/image", label: "Image" },
  { href: "/tools/document", label: "PDF" },
  { href: "/tools/video", label: "Video" },
  { href: "/tools/developer", label: "Developer" },
  { href: "/", label: "All Tools" },
];

// Full list for the mobile menu.
const links = [
  { href: "/tools/image", label: "Image" },
  { href: "/tools/document", label: "PDF" },
  { href: "/tools/video", label: "Video" },
  { href: "/tools/audio", label: "Audio" },
  { href: "/tools/text", label: "Text" },
  { href: "/tools/developer", label: "Developer" },
  { href: "/tools/security", label: "Security" },
  { href: "/tools/network", label: "Network" },
  { href: "/tools/seo", label: "SEO" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outline-soft)] bg-[var(--header-bg)] backdrop-blur-xl">
      <Container className="py-3.5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 text-xl font-semibold tracking-tight text-[var(--ink-900)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-500)] text-white shadow-[var(--shadow-soft)]">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14.7 6.3a4 4 0 0 1 0 5.6l-2.1 2.1-1.4-1.4 2.1-2.1a2 2 0 0 0-2.8-2.8L8.4 9.8 7 8.4l2.1-2.1a4 4 0 0 1 5.6 0Z" />
                <path d="M12.9 11.1l1.4 1.4-2.1 2.1a4 4 0 0 1-5.6-5.6l2.1-2.1" />
              </svg>
            </span>
            <span className="truncate text-lg font-bold sm:text-xl">
              ToolsWebsite
            </span>
          </Link>

          <div className="hidden items-center gap-3 lg:flex">
            <nav className="flex items-center gap-2">
              {desktopLinks.map((link) => {
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
            <Link
              href="/#premium"
              className="rounded-full bg-[var(--accent-500)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-600)]"
            >
              Early access
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)] shadow-[var(--shadow-soft)]"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
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
            className="mt-3 rounded-[1.4rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-lift)] lg:hidden"
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
