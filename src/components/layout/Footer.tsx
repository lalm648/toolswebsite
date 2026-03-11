import Link from "next/link";
import Container from "@/components/Container";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--outline-soft)] bg-[var(--footer-bg)]">
      <Container className="flex flex-col gap-4 py-8 text-sm text-[var(--muted-foreground)] md:flex-row md:items-center md:justify-between">
        <p>© 2026 ToolsWebsite. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/about" className="hover:text-[var(--foreground-strong)]">
            About
          </Link>
          <Link href="/contact" className="hover:text-[var(--foreground-strong)]">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:text-[var(--foreground-strong)]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[var(--foreground-strong)]">
            Terms
          </Link>
        </div>
      </Container>
    </footer>
  );
}
