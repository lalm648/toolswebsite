import Link from "next/link";
import Container from "./Container";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          ToolsWebsite
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            Home
          </Link>
          <Link href="/about" className="text-sm text-slate-600 hover:text-slate-900">
            About
          </Link>
          <Link href="/contact" className="text-sm text-slate-600 hover:text-slate-900">
            Contact
          </Link>
          <Link href="/privacy-policy" className="text-sm text-slate-600 hover:text-slate-900">
            Privacy
          </Link>
        </nav>
      </Container>
    </header>
  );
}