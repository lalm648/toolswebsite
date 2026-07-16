import Link from "next/link";
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
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms" },
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
    <footer className="mt-16 bg-[var(--footer-bg)] text-slate-300">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold text-white"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-500)] text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
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
              ToolsWebsite
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
              <ul className="mt-4 space-y-3">
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

        <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          {trustSignals.map((signal) => (
            <div key={signal.label} className="flex items-start gap-3">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-500)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-white">
                  {signal.label}
                </p>
                <p className="text-xs text-slate-400">{signal.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ToolsWebsite. All rights reserved.</p>
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
