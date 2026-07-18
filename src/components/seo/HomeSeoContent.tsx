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
    <section className="overflow-hidden rounded-[1.75rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)]">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-9 lg:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">One browser workspace</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">Free online tools for faster, private everyday work</h2>
          <div className="mt-5 max-w-2xl space-y-4 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
            <p>ToolsWebsite brings {tools.length} focused utilities into one searchable library for images, PDF documents, video, audio, text, development, security, SEO, and public web diagnostics. Each page is designed around one clear task, so you can reach the right control quickly and understand what will happen before you run it.</p>
            <p>File-based workflows are built to run locally where browser technology allows it. That reduces unnecessary uploads and makes quick edits easier on desktop and mobile. Network checks clearly identify the cases that require a protected server request to reach a public destination.</p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.href} href={category.href} className="rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-3.5 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent-300)] hover:text-[var(--accent-700)]">
                {category.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative min-h-72 overflow-hidden border-t border-[var(--outline-soft)] bg-[linear-gradient(145deg,var(--accent-50),var(--surface-panel)_55%,var(--brand-50))] p-8 lg:border-l lg:border-t-0" aria-label="Browser tool workflow illustration" role="img">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[24px] border-[var(--accent-100)] opacity-70" />
          <div className="relative mx-auto flex h-full max-w-md items-center justify-center">
            <div className="w-full rounded-[1.4rem] border border-[var(--outline-strong)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-lift)]">
              <div className="flex items-center gap-2 border-b border-[var(--outline-soft)] pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 h-7 flex-1 rounded-full bg-[var(--surface-panel)]" />
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-500)] text-xl font-black text-white">T</span>
                <div><div className="h-3 w-3/4 rounded-full bg-[var(--ink-900)]" /><div className="mt-2 h-2.5 w-full rounded-full bg-[var(--outline-strong)]" /></div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Choose", "Process", "Download"].map((label, index) => (
                  <div key={label} className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-center">
                    <span className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-100)] text-xs font-bold text-[var(--accent-700)]">{index + 1}</span>
                    <span className="mt-2 block text-xs font-semibold text-[var(--ink-900)]">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                <span>Ready in your browser</span><span aria-hidden="true">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t border-[var(--outline-soft)] bg-[var(--outline-soft)] lg:grid-cols-3">
        {workflows.map((workflow) => (
          <article key={workflow.title} className="bg-[var(--surface-card)] p-6 sm:p-7">
            <h3 className="text-lg font-bold text-[var(--ink-900)]">{workflow.title}</h3>
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
