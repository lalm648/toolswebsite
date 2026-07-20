import Link from "next/link";
import { categories, tools } from "@/lib/data/tools";

const workflows = [
  {
    title: "Make websites faster",
    description: "Resize oversized assets, reduce image weight, and move photos into modern delivery formats before publishing.",
    links: [
      { href: "/tools/image/image-compressor", label: "Compress an image" },
      { href: "/tools/image/image-resizer", label: "Resize an image" },
      { href: "/tools/image/format-converter", label: "Convert image formats" },
    ],
  },
  {
    title: "Prepare documents and content",
    description: "Combine PDFs, extract usable copy, count text, and clean formatting without moving between heavy desktop apps.",
    links: [
      { href: "/tools/document/pdf-merger", label: "Merge PDF files" },
      { href: "/tools/document/pdf-text-extractor", label: "Extract PDF text" },
      { href: "/tools/text/word-counter", label: "Count words" },
    ],
  },
  {
    title: "Check code, search, and security",
    description: "Format payloads, prepare page metadata, inspect public websites, and generate secure values from focused utilities.",
    links: [
      { href: "/tools/developer/json-formatter", label: "Format JSON" },
      { href: "/tools/seo/meta-tag-generator", label: "Generate meta tags" },
      { href: "/tools/security/password-generator", label: "Generate a password" },
    ],
  },
];

export default function HomeSeoContent() {
  return (
    <section className="border-y border-[var(--outline-soft)] py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">One browser workspace</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">Free online tools for faster, private everyday work</h2>
          <div className="mt-4 max-w-2xl space-y-4 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
            <p>Webutilia brings {tools.length} focused utilities into one searchable library for images, PDF documents, video, audio, text, development, security, SEO, and public web diagnostics. Each page is designed around one clear task, so you can reach the right control quickly and understand what will happen before you run it.</p>
          </div>

          <details className="mt-4 text-sm text-[var(--muted-foreground)]">
            <summary className="cursor-pointer font-semibold text-[var(--accent-700)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]">Learn how processing works</summary>
            <p className="mt-3 max-w-2xl leading-7">File-based workflows are built to run locally where browser technology allows it. That reduces unnecessary uploads and makes quick edits easier on desktop and mobile. Network checks clearly identify the cases that require a protected server request to reach a public destination.</p>
          </details>

          <nav aria-label="Tool categories" className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((category) => (
              <Link key={category.href} href={category.href} className="text-sm font-semibold text-[var(--foreground)] underline decoration-[var(--outline-strong)] underline-offset-4 hover:text-[var(--accent-700)]">
                {category.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="divide-y divide-[var(--outline-soft)] border-y border-[var(--outline-soft)] lg:border-b-0 lg:border-t-0">
          {[
            ["01", "Choose one focused tool", "Clear formats, limits, and privacy boundaries before you begin."],
            ["02", "Process with useful feedback", "Progress, validation, and local processing where the browser supports it."],
            ["03", "Review and download", "Preview the result, save it, reset the workspace, and keep moving."],
          ].map(([number, title, description]) => (
            <div key={number} className="grid grid-cols-[auto_1fr] gap-4 py-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-50)] text-xs font-bold text-[var(--accent-700)]">{number}</span>
              <div>
                <h3 className="font-bold text-[var(--ink-900)]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-4 text-sm font-semibold text-[var(--accent-700)]">
            <span>Ready in your browser</span><span aria-hidden="true">✓</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-7 border-t border-[var(--outline-soft)] pt-7 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <article key={workflow.title}>
            <h3 className="text-base font-bold text-[var(--ink-900)]">{workflow.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{workflow.description}</p>
            <ul className="mt-4 space-y-2">
              {workflow.links.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm font-semibold text-[var(--accent-700)] hover:underline">{link.label} <span aria-hidden="true">→</span></Link></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
