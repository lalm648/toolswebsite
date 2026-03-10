import Link from "next/link";
import Container from "@/components/Container";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>© 2026 ToolsWebsite. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/about" className="hover:text-slate-950">
            About
          </Link>
          <Link href="/contact" className="hover:text-slate-950">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:text-slate-950">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-950">
            Terms
          </Link>
        </div>
      </Container>
    </footer>
  );
}
