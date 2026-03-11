"use client";

import { useMemo, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function buildMetaTags({
  title,
  description,
  url,
  image,
  siteName,
  type,
  twitterCard,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  type: string;
  twitterCard: string;
}) {
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta name="twitter:card" content="${twitterCard}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];

  return lines.join("\n");
}

export default function MetaTagGeneratorTool() {
  const [title, setTitle] = useState("ToolsWebsite | Browser-first online tools");
  const [description, setDescription] = useState(
    "Convert images, format JSON, count words, and use practical browser-first tools without sending files to a server."
  );
  const [url, setUrl] = useState("https://toolswebsite.example");
  const [image, setImage] = useState("https://toolswebsite.example/og-image.png");
  const [siteName, setSiteName] = useState("ToolsWebsite");
  const [type, setType] = useState("website");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");

  const output = useMemo(
    () =>
      buildMetaTags({
        title,
        description,
        url,
        image,
        siteName,
        type,
        twitterCard,
      }),
    [description, image, siteName, title, twitterCard, type, url]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">SEO fields</h2>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Generate basic title, description, Open Graph, and Twitter meta tags.
              </p>
            </div>
            <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
              Live output
            </Badge>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-[var(--ink-900)]">
              Title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" />
              <span className="mt-2 block text-xs text-[var(--muted-foreground)]">{title.length} characters</span>
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Description
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28" />
              <span className="mt-2 block text-xs text-[var(--muted-foreground)]">{description.length} characters</span>
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Canonical URL
              <Input value={url} onChange={(event) => setUrl(event.target.value)} className="mt-2" />
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              OG Image URL
              <Input value={image} onChange={(event) => setImage(event.target.value)} className="mt-2" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Site name
                <Input value={siteName} onChange={(event) => setSiteName(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                OG type
                <Input value={type} onChange={(event) => setType(event.target.value)} className="mt-2" />
              </label>
            </div>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Twitter card
              <Input value={twitterCard} onChange={(event) => setTwitterCard(event.target.value)} className="mt-2" />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ToolResult title="Search preview">
          <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-5 text-left">
            <p className="truncate text-sm text-[var(--accent-600)]">{url}</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--accent-700)]">{title || "Page title"}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              {description || "Meta description preview will appear here."}
            </p>
          </div>
        </ToolResult>

        <ToolResult title="Generated meta tags">
          <Textarea readOnly value={output} className="min-h-[320px] font-mono text-sm" />
        </ToolResult>
      </div>
    </div>
  );
}
