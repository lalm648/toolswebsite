import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import CookieSettingsButton from "@/components/layout/CookieSettingsButton";

const columns = [
  {
    title: "Media tools",
    links: [
      { href: "/tools/image", label: "Image Tools" },
      { href: "/tools/video", label: "Video Tools" },
      { href: "/tools/audio", label: "Audio Tools" },
      { href: "/tools/document", label: "Document & PDF" },
    ],
  },
  {
    title: "Technical tools",
    links: [
      { href: "/tools/text", label: "Text Tools" },
      { href: "/tools/developer", label: "Code & Data" },
      { href: "/tools/security", label: "Security & Generators" },
      { href: "/tools/network", label: "Web & Network" },
      { href: "/tools/seo", label: "SEO Tools" },
      { href: "/tools/dictionary", label: "Dictionary & Language" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms" },
      { href: "/sitemap.xml", label: "Sitemap" },
    ],
  },
];

const trustSignals = [
  {
    label: "Local file processing",
    detail: "Media and documents stay on your device",
  },
  { label: "No signup", detail: "Every core tool is free to use" },
  {
    label: "Clear privacy boundaries",
    detail: "Network checks show when a server request is required",
  },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-[var(--footer-bg)] text-slate-300">
      <div className="border-b border-white/10">
        <Container className="grid gap-3 py-4 sm:grid-cols-3">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--accent-300)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <p className="text-xs text-slate-400"><span className="font-semibold text-white">{signal.label}</span><span className="hidden lg:inline"> · {signal.detail}</span></p>
            </div>
          ))}
        </Container>
      </div>
      <Container className="py-9">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold text-white"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center">
                <Image src="/webutilia-logo.png" width={36} height={36} alt="" className="h-9 w-9 object-contain" />
              </span>
              Webutilia
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Practical browser tools for media, documents, code, security, and
              web operations. No sign-up required.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Webutilia. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <CookieSettingsButton className="hover:text-white" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
