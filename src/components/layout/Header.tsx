"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Container from "@/components/Container";
import ThemeToggle from "@/components/layout/ThemeToggle";

const desktopLinks = [
  { href: "/tools/image", label: "Image" },
  { href: "/tools/document", label: "PDF" },
  { href: "/tools/video", label: "Video" },
  { href: "/tools/developer", label: "Developer" },
];

const moreDesktopLinks = [
  { href: "/tools/audio", label: "Audio Tools" },
  { href: "/tools/text", label: "Text Tools" },
  { href: "/tools/security", label: "Security & Generators" },
  { href: "/tools/network", label: "Web & Network Tools" },
  { href: "/tools/seo", label: "SEO Tools" },
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
  if (href.startsWith("/#")) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMoreActive = moreDesktopLinks.some((link) =>
    isActiveLink(pathname, link.href),
  );

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outline-soft)] bg-[var(--header-bg)] backdrop-blur-xl">
      <Container className="py-2.5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-lg text-xl font-semibold tracking-tight text-[var(--ink-900)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center">
              <Image src="/webutilia-logo.png" width={40} height={40} alt="" priority className="h-10 w-10 object-contain" />
            </span>
            <span className="truncate text-lg font-bold sm:text-xl">
              Webutilia
            </span>
          </Link>

          <div className="hidden items-center gap-3 lg:flex">
            <nav aria-label="Primary navigation" className="flex items-center gap-1">
              {desktopLinks.map((link) => {
                const isActive = isActiveLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
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
              <details className="group relative">
                <summary
                  className={`flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] [&::-webkit-details-marker]:hidden ${
                    isMoreActive
                      ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
                  }`}
                >
                  More
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="m4 6 4 4 4-4" />
                  </svg>
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-[var(--radius-md)] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-2 shadow-[var(--shadow-lift)]">
                  {moreDesktopLinks.map((link) => {
                    const isActive = isActiveLink(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={(event) => {
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                        className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                          isActive
                            ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                            : "text-[var(--foreground)] hover:bg-[var(--surface-panel)] hover:text-[var(--ink-900)]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </details>
              <Link
                href="/#tool-library"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${
                  pathname === "/"
                    ? "bg-[var(--accent-50)] text-[var(--accent-700)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]"
                }`}
              >
                All Tools
              </Link>
            </nav>
            <ThemeToggle />
            <Link
              href="/#premium"
              className="inline-flex h-9 items-center rounded-full bg-[var(--action-bg)] px-4 text-sm font-semibold text-[var(--action-fg)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--action-bg-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            >
              Early access
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle compact />
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
            className="mt-3 rounded-[var(--radius-xl)] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 shadow-[var(--shadow-soft)] lg:hidden"
          >
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {links.map((link) => {
                const isActive = isActiveLink(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium ${
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
