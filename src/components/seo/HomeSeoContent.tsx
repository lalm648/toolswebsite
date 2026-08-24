import Link from "next/link";
import { categories, tools } from "@/lib/data/tools";

const workflows = [
  {
    eyebrow: "Images & delivery",
    title: "Prepare lighter website images",
    description:
      "Move from oversized source files to correctly sized, modern assets in one clear sequence.",
    accent: "emerald",
    links: [
      { href: "/tools/image/image-resizer", label: "Resize the source" },
      { href: "/tools/image/image-compressor", label: "Reduce file size" },
      { href: "/tools/image/format-converter", label: "Export a web format" },
    ],
  },
  {
    eyebrow: "Documents & copy",
    title: "Turn documents into usable content",
    description:
      "Combine source material, extract the text layer, then clean and measure the copy for reuse.",
    accent: "orange",
    links: [
      { href: "/tools/document/pdf-merger", label: "Combine PDF files" },
      {
        href: "/tools/document/pdf-text-extractor",
        label: "Extract readable text",
      },
      { href: "/tools/text/remove-extra-spaces", label: "Clean the result" },
    ],
  },
  {
    eyebrow: "Build & publish",
    title: "Check a page before it ships",
    description:
      "Validate the data, create accurate search metadata, and inspect the live page after publishing.",
    accent: "cyan",
    links: [
      {
        href: "/tools/developer/json-formatter",
        label: "Validate structured data",
      },
      { href: "/tools/seo/meta-tag-generator", label: "Build page metadata" },
      {
        href: "/tools/network/broken-link-checker",
        label: "Check published links",
      },
    ],
  },
  {
    eyebrow: "Audio & video",
    title: "Create a share-ready media file",
    description:
      "Trim heavy footage, separate or combine audio, then export a smaller file for the final channel.",
    accent: "violet",
    links: [
      { href: "/tools/video/video-clipper", label: "Trim the video" },
      { href: "/tools/video/audio-extractor", label: "Extract the soundtrack" },
      { href: "/tools/audio/audio-joiner", label: "Join or mix audio" },
    ],
  },
];

const workflowAccent: Record<string, string> = {
  emerald: "from-emerald-500/12 via-emerald-500/[0.04]",
  orange: "from-orange-500/12 via-orange-500/[0.04]",
  cyan: "from-cyan-500/12 via-cyan-500/[0.04]",
  violet: "from-violet-500/12 via-violet-500/[0.04]",
};

export default function HomeSeoContent() {
  return (
    <section className="border-y border-[var(--outline-soft)] py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">
            One browser workspace
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Free online tools for faster, private everyday work
          </h2>
          <div className="mt-4 max-w-2xl space-y-4 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
            <p>
              Webutilia brings {tools.length} focused utilities into one
              searchable library for images, PDF documents, video, audio, text,
              development, security, SEO, and public web diagnostics. Each page
              is designed around one clear task, so you can reach the right
              control quickly and understand what will happen before you run it.
            </p>
          </div>

          <details className="mt-4 text-sm text-[var(--muted-foreground)]">
            <summary className="cursor-pointer font-semibold text-[var(--accent-700)] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]">
              Learn how processing works
            </summary>
            <p className="mt-3 max-w-2xl leading-7">
              File-based workflows are built to run locally where browser
              technology allows it. That reduces unnecessary uploads and makes
              quick edits easier on desktop and mobile. Network checks clearly
              identify the cases that require a protected server request to
              reach a public destination.
            </p>
          </details>

          <nav
            aria-label="Tool categories"
            className="mt-6 flex flex-wrap gap-x-4 gap-y-2"
          >
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="text-sm font-semibold text-[var(--foreground)] underline decoration-[var(--outline-strong)] underline-offset-4 hover:text-[var(--accent-700)]"
              >
                {category.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="divide-y divide-[var(--outline-soft)] border-y border-[var(--outline-soft)] lg:border-b-0 lg:border-t-0">
          {[
            [
              "01",
              "Choose one focused tool",
              "Clear formats, limits, and privacy boundaries before you begin.",
            ],
            [
              "02",
              "Process with useful feedback",
              "Progress, validation, and local processing where the browser supports it.",
            ],
            [
              "03",
              "Review and download",
              "Preview the result, save it, reset the workspace, and keep moving.",
            ],
          ].map(([number, title, description]) => (
            <div key={number} className="grid grid-cols-[auto_1fr] gap-4 py-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-50)] text-xs font-bold text-[var(--accent-700)]">
                {number}
              </span>
              <div>
                <h3 className="font-bold text-[var(--ink-900)]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-4 text-sm font-semibold text-[var(--accent-700)]">
            <span>Ready in your browser</span>
            <span aria-hidden="true">✓</span>
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-3 border-t border-[var(--outline-soft)] pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-700)]">
            Connected workflows
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
            Finish the whole task, not just one step
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          Each path links tools in the order people commonly need them, making
          the next useful action easy to find.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <article
            key={workflow.title}
            className={`group rounded-[var(--radius-lg)] border border-[var(--outline-soft)] bg-gradient-to-br ${workflowAccent[workflow.accent]} to-transparent p-5 text-[var(--accent-700)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-300)] hover:shadow-[var(--shadow-lift)]`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]">
              {workflow.eyebrow}
            </p>
            <h3 className="mt-2 text-lg font-bold text-[var(--ink-900)]">
              {workflow.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {workflow.description}
            </p>
            <ol className="mt-5 grid gap-2">
              {workflow.links.map((link, index) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--outline-soft)] bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold text-[var(--ink-900)] shadow-[var(--shadow-soft)] hover:border-current hover:text-current focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)]"
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--surface-panel)] text-[10px] font-bold tabular-nums"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
