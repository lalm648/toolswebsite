import Link from "next/link";
import Container from "@/components/Container";

const links = [
  { href: "/tools/image", label: "Image" },
  { href: "/tools/text", label: "Text" },
  { href: "/tools/developer", label: "Developer" },
  { href: "/tools/seo", label: "SEO" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--outline-soft)] bg-[rgba(248,249,255,0.88)] backdrop-blur-xl">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight text-[var(--ink-900)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--accent-500),var(--brand-500))] text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
            TW
          </span>
          <span>ToolsWebsite</span>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
