"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";

type PresetMode = "website" | "article" | "product" | "tool";

type MetaTagOptions = {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageWidth: string;
  imageHeight: string;
  siteName: string;
  type: string;
  locale: string;
  robots: string;
  twitterCard: string;
  twitterSite: string;
  twitterCreator: string;
  author: string;
  keywords: string;
};

type LocalImagePreview = {
  fileName: string;
  url: string;
  width: number;
  height: number;
};

type WarningItem = {
  level: "warning" | "info";
  message: string;
};

type PresetConfig = {
  label: string;
  badge: string;
  type: string;
  jsonLdType: string;
  title: string;
  description: string;
  robots: string;
  twitterCard: string;
  keywords: string;
};

const presetConfigs: Record<PresetMode, PresetConfig> = {
  website: {
    label: "Website",
    badge: "Site-wide SEO",
    type: "website",
    jsonLdType: "WebSite",
    title: "ToolsWebsite | Browser-first online tools",
    description:
      "Convert images, format JSON, count words, and use practical browser-first tools without sending files to a server.",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "online tools, image tools, developer tools, seo tools",
  },
  article: {
    label: "Article",
    badge: "Editorial SEO",
    type: "article",
    jsonLdType: "Article",
    title: "How to optimize image workflows for the web",
    description: "A practical guide to image formats, compression, and metadata for faster pages and stronger sharing previews.",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "article seo, image optimization, web performance",
  },
  product: {
    label: "Product",
    badge: "Commercial SEO",
    type: "product",
    jsonLdType: "Product",
    title: "AI Image Toolkit | Fast browser-based editing",
    description: "Edit, compress, and convert images with a lightweight browser workflow designed for product teams and marketers.",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "product seo, saas product, image toolkit",
  },
  tool: {
    label: "Tool Page",
    badge: "Utility SEO",
    type: "website",
    jsonLdType: "SoftwareApplication",
    title: "JPG to PNG Converter | Fast browser tool",
    description: "Convert JPG images to PNG directly in your browser with live preview, instant download, and no server upload.",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "jpg to png, image converter, browser tool",
  },
};

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags({
  title,
  description,
  canonicalUrl,
  imageUrl,
  imageAlt,
  imageWidth,
  imageHeight,
  siteName,
  type,
  locale,
  robots,
  twitterCard,
  twitterSite,
  twitterCreator,
  author,
  keywords,
}: MetaTagOptions) {
  const lines = [
    `<title>${escapeAttribute(title)}</title>`,
    `<meta name="description" content="${escapeAttribute(description)}" />`,
    canonicalUrl ? `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />` : "",
    robots ? `<meta name="robots" content="${escapeAttribute(robots)}" />` : "",
    author ? `<meta name="author" content="${escapeAttribute(author)}" />` : "",
    keywords ? `<meta name="keywords" content="${escapeAttribute(keywords)}" />` : "",
    `<meta property="og:title" content="${escapeAttribute(title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`,
    `<meta property="og:type" content="${escapeAttribute(type)}" />`,
    canonicalUrl ? `<meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />` : "",
    siteName ? `<meta property="og:site_name" content="${escapeAttribute(siteName)}" />` : "",
    locale ? `<meta property="og:locale" content="${escapeAttribute(locale)}" />` : "",
    imageUrl ? `<meta property="og:image" content="${escapeAttribute(imageUrl)}" />` : "",
    imageAlt ? `<meta property="og:image:alt" content="${escapeAttribute(imageAlt)}" />` : "",
    imageWidth ? `<meta property="og:image:width" content="${escapeAttribute(imageWidth)}" />` : "",
    imageHeight ? `<meta property="og:image:height" content="${escapeAttribute(imageHeight)}" />` : "",
    `<meta name="twitter:card" content="${escapeAttribute(twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    twitterSite ? `<meta name="twitter:site" content="${escapeAttribute(twitterSite)}" />` : "",
    twitterCreator ? `<meta name="twitter:creator" content="${escapeAttribute(twitterCreator)}" />` : "",
    imageUrl ? `<meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />` : "",
    imageAlt ? `<meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}" />` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function buildJsonLd(mode: PresetMode, options: MetaTagOptions) {
  const base = {
    "@context": "https://schema.org",
    "@type": presetConfigs[mode].jsonLdType,
    name: options.title,
    description: options.description,
    url: options.canonicalUrl || undefined,
    image: options.imageUrl || undefined,
    inLanguage: options.locale ? options.locale.replace("_", "-") : undefined,
    author: options.author ? { "@type": "Organization", name: options.author } : undefined,
  };

  if (mode === "article") {
    return JSON.stringify(
      {
        ...base,
        headline: options.title,
        publisher: options.siteName ? { "@type": "Organization", name: options.siteName } : undefined,
      },
      null,
      2
    );
  }

  if (mode === "product") {
    return JSON.stringify(
      {
        ...base,
        brand: options.siteName ? { "@type": "Brand", name: options.siteName } : undefined,
      },
      null,
      2
    );
  }

  if (mode === "tool") {
    return JSON.stringify(
      {
        ...base,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(base, null, 2);
}

function loadImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = url;
  });
}

function scoreTitle(value: string) {
  const length = value.trim().length;
  if (length === 0) return { label: "Missing", tone: "text-[var(--brand-700)]" };
  if (length < 30) return { label: "Too short", tone: "text-[var(--brand-700)]" };
  if (length <= 60) return { label: "Strong", tone: "text-emerald-700" };
  if (length <= 70) return { label: "Acceptable", tone: "text-amber-700" };
  return { label: "Too long", tone: "text-[var(--brand-700)]" };
}

function scoreDescription(value: string) {
  const length = value.trim().length;
  if (length === 0) return { label: "Missing", tone: "text-[var(--brand-700)]" };
  if (length < 70) return { label: "Too short", tone: "text-[var(--brand-700)]" };
  if (length <= 160) return { label: "Strong", tone: "text-emerald-700" };
  if (length <= 175) return { label: "Acceptable", tone: "text-amber-700" };
  return { label: "Too long", tone: "text-[var(--brand-700)]" };
}

function isLikelyAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export default function MetaTagGeneratorTool() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preset, setPreset] = useState<PresetMode>("website");
  const [title, setTitle] = useState(presetConfigs.website.title);
  const [description, setDescription] = useState(presetConfigs.website.description);
  const [canonicalUrl, setCanonicalUrl] = useState("https://toolswebsite.example");
  const [imageUrl, setImageUrl] = useState("https://toolswebsite.example/og-image.png");
  const [imageAlt, setImageAlt] = useState("ToolsWebsite preview card");
  const [imageWidth, setImageWidth] = useState("1200");
  const [imageHeight, setImageHeight] = useState("630");
  const [siteName, setSiteName] = useState("ToolsWebsite");
  const [type, setType] = useState(presetConfigs.website.type);
  const [locale, setLocale] = useState("en_US");
  const [robots, setRobots] = useState(presetConfigs.website.robots);
  const [twitterCard, setTwitterCard] = useState(presetConfigs.website.twitterCard);
  const [twitterSite, setTwitterSite] = useState("@toolswebsite");
  const [twitterCreator, setTwitterCreator] = useState("@toolswebsite");
  const [author, setAuthor] = useState("ToolsWebsite");
  const [keywords, setKeywords] = useState(presetConfigs.website.keywords);
  const [imageError, setImageError] = useState("");
  const [copyState, setCopyState] = useState<"" | "meta" | "jsonld">("");
  const [localPreview, setLocalPreview] = useState<LocalImagePreview | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview?.url) {
        URL.revokeObjectURL(localPreview.url);
      }
    };
  }, [localPreview]);

  function applyPreset(nextPreset: PresetMode) {
    const config = presetConfigs[nextPreset];
    setPreset(nextPreset);
    setTitle(config.title);
    setDescription(config.description);
    setType(config.type);
    setRobots(config.robots);
    setTwitterCard(config.twitterCard);
    setKeywords(config.keywords);
  }

  async function handleImageUpload(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file for the SEO preview.");
      return;
    }

    if (localPreview?.url) {
      URL.revokeObjectURL(localPreview.url);
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const dimensions = await loadImageDimensions(objectUrl);
      setLocalPreview({
        fileName: file.name,
        url: objectUrl,
        width: dimensions.width,
        height: dimensions.height,
      });
      setImageWidth(String(dimensions.width));
      setImageHeight(String(dimensions.height));
      setImageAlt((current) => current || file.name.replace(/\.[^.]+$/, ""));
      setImageError("");
    } catch {
      URL.revokeObjectURL(objectUrl);
      setImageError("This image could not be loaded for preview.");
    }
  }

  const metaOptions = useMemo(
    () => ({
      title,
      description,
      canonicalUrl,
      imageUrl,
      imageAlt,
      imageWidth,
      imageHeight,
      siteName,
      type,
      locale,
      robots,
      twitterCard,
      twitterSite,
      twitterCreator,
      author,
      keywords,
    }),
    [
      title,
      description,
      canonicalUrl,
      imageUrl,
      imageAlt,
      imageWidth,
      imageHeight,
      siteName,
      type,
      locale,
      robots,
      twitterCard,
      twitterSite,
      twitterCreator,
      author,
      keywords,
    ]
  );

  const output = useMemo(() => buildMetaTags(metaOptions), [metaOptions]);
  const jsonLd = useMemo(() => buildJsonLd(preset, metaOptions), [preset, metaOptions]);
  const titleScore = useMemo(() => scoreTitle(title), [title]);
  const descriptionScore = useMemo(() => scoreDescription(description), [description]);

  const warnings = useMemo(() => {
    const items: WarningItem[] = [];

    if (!title.trim()) items.push({ level: "warning", message: "Title is required." });
    if (!description.trim()) items.push({ level: "warning", message: "Description is required." });
    if (title.trim().length > 70) items.push({ level: "warning", message: "Title is likely too long for search results." });
    if (description.trim().length > 175)
      items.push({ level: "warning", message: "Description is likely too long and may be truncated." });
    if (!canonicalUrl.trim()) items.push({ level: "warning", message: "Canonical URL is missing." });
    if (canonicalUrl.trim() && !isLikelyAbsoluteUrl(canonicalUrl))
      items.push({ level: "warning", message: "Canonical URL should be absolute, including https://." });
    if (!imageUrl.trim())
      items.push({ level: "warning", message: "Social image URL is missing. Social previews may be weak without it." });
    if (imageUrl.trim() && !isLikelyAbsoluteUrl(imageUrl))
      items.push({ level: "warning", message: "Social image URL should be absolute and publicly reachable." });
    if (!imageAlt.trim()) items.push({ level: "info", message: "Add image alt text for richer accessibility and preview metadata." });
    if (!imageWidth.trim() || !imageHeight.trim())
      items.push({ level: "info", message: "Image dimensions help social platforms render previews faster." });
    if (!twitterSite.trim()) items.push({ level: "info", message: "Twitter site handle is optional but useful for branded cards." });

    return items;
  }, [title, description, canonicalUrl, imageUrl, imageAlt, imageWidth, imageHeight, twitterSite]);

  async function copyToClipboard(value: string, kind: "meta" | "jsonld") {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(kind);
      trackEvent("copy_output", {
        tool_slug: "meta-tag-generator",
        output_kind: kind === "meta" ? "meta_tags" : "json_ld",
        output_length: value.length,
        preset_mode: preset,
      });
      window.setTimeout(() => setCopyState(""), 1800);
    } catch {
      setCopyState("");
      trackToolFailure("meta-tag-generator", "copy_output", "clipboard_write_failed", {
        output_kind: kind === "meta" ? "meta_tags" : "json_ld",
        output_length: value.length,
        preset_mode: preset,
      });
    }
  }

  const previewImageSource = localPreview?.url || imageUrl;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Preset mode</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Start with a mode that matches the page you are optimizing, then fine-tune the fields.
              </p>
            </div>
            <Badge className="border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)]">
              {presetConfigs[preset].badge}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              Object.entries(presetConfigs) as Array<[PresetMode, PresetConfig]>
            ).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`rounded-[1.1rem] border px-4 py-4 text-left shadow-[var(--shadow-soft)] ${
                  preset === key
                    ? "border-[var(--accent-500)] bg-[var(--accent-50)]"
                    : "border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                }`}
              >
                <p className="text-sm font-semibold text-[var(--ink-900)]">{config.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{config.badge}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">SEO fields</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Generate stronger SEO, Open Graph, Twitter, and structured data with a proper social image setup.
              </p>
            </div>
            <Badge className="border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)]">
              Live output
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 rounded-[1.2rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--accent-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-700)]">
                Core SEO
              </span>
              <span className={`text-xs font-semibold ${titleScore.tone}`}>Title: {titleScore.label}</span>
              <span className={`text-xs font-semibold ${descriptionScore.tone}`}>Description: {descriptionScore.label}</span>
            </div>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Title
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" />
              <span className={`mt-2 block text-xs ${titleScore.tone}`}>{title.length} characters · {titleScore.label}</span>
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Description
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28" />
              <span className={`mt-2 block text-xs ${descriptionScore.tone}`}>
                {description.length} characters · {descriptionScore.label}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Canonical URL
                <Input value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                OG type
                <Input value={type} onChange={(event) => setType(event.target.value)} className="mt-2" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Site name
                <Input value={siteName} onChange={(event) => setSiteName(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Locale
                <Input value={locale} onChange={(event) => setLocale(event.target.value)} className="mt-2" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Robots
                <Input value={robots} onChange={(event) => setRobots(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Author
                <Input value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-2" />
              </label>
            </div>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Keywords
              <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="mt-2" />
            </label>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">SEO image</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Use a hosted image URL for production tags, or upload a local image to preview and auto-fill dimensions.
              </p>
            </div>
            <Badge className="border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)]">
              Social card
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 rounded-[1.2rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-700)]">
                Social Image
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">Open Graph and Twitter image fields with preview support.</span>
            </div>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Image URL
              <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="mt-2" />
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Image alt text
              <Input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} className="mt-2" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Image width
                <Input value={imageWidth} onChange={(event) => setImageWidth(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Image height
                <Input value={imageHeight} onChange={(event) => setImageHeight(event.target.value)} className="mt-2" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Twitter card
                <Input value={twitterCard} onChange={(event) => setTwitterCard(event.target.value)} className="mt-2" />
              </label>
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Twitter site
                <Input value={twitterSite} onChange={(event) => setTwitterSite(event.target.value)} className="mt-2" />
              </label>
            </div>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Twitter creator
              <Input value={twitterCreator} onChange={(event) => setTwitterCreator(event.target.value)} className="mt-2" />
            </label>

            <div className="rounded-[1.2rem] border border-dashed border-[var(--outline-strong)] bg-[var(--surface-panel)] p-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">Preview a local social image</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    Recommended size: 1200 x 630 for large social cards.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => imageInputRef.current?.click()}>
                  Upload image
                </Button>
              </div>
              {localPreview ? (
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  {localPreview.fileName} · {localPreview.width} x {localPreview.height}
                </p>
              ) : null}
              {imageError ? <p className="mt-3 text-sm text-[var(--brand-600)]">{imageError}</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <ToolResult title="Warnings and quality checks">
          <div className="space-y-3">
            {warnings.length ? (
              warnings.map((item) => (
                <div
                  key={item.message}
                  className={`rounded-[1.1rem] border px-4 py-3 text-sm leading-6 ${
                    item.level === "warning"
                      ? "border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "border-[var(--outline-soft)] bg-[var(--surface-panel)] text-[var(--foreground)]"
                  }`}
                >
                  {item.message}
                </div>
              ))
            ) : (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Core SEO fields look solid. You have the minimum data needed for a strong snippet and social card.
              </div>
            )}
          </div>
        </ToolResult>

        <ToolResult title="Search preview">
          <div className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,255,0.98))] p-5 text-left shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Search Snippet
              </span>
            </div>
            <p className="mt-3 truncate text-sm font-medium text-[var(--accent-700)]">{canonicalUrl}</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--ink-900)]">{title || "Page title"}</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
              {description || "Meta description preview will appear here."}
            </p>
          </div>
        </ToolResult>

        <ToolResult title="Social preview">
          <div className="overflow-hidden rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-left shadow-[var(--shadow-soft)]">
            <div className="aspect-[1200/630] w-full bg-[linear-gradient(135deg,var(--accent-100),var(--brand-50))]">
              {previewImageSource ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImageSource} alt={imageAlt || "Social preview"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--foreground)]">
                  Social image preview will appear here
                </div>
              )}
            </div>
            <div className="space-y-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,247,255,0.98))] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {siteName || "Site name"}
                </p>
                <span className="rounded-full bg-[var(--accent-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-700)]">
                  {twitterCard}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink-900)]">{title || "Page title"}</h3>
              <p className="text-sm leading-6 text-[var(--foreground)]">
                {description || "Description will appear in the social card preview."}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1">
                  {imageWidth || "?"} x {imageHeight || "?"}
                </span>
                <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1">{type}</span>
                <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1">{locale}</span>
              </div>
            </div>
          </div>
        </ToolResult>

        <ToolResult title="Generated meta tags">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">Ready-to-paste HTML head tags.</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyToClipboard(output, "meta")}>
              {copyState === "meta" ? "Copied" : "Copy tags"}
            </Button>
          </div>
          <Textarea
            readOnly
            value={output}
            className="min-h-[360px] border-[var(--outline-strong)] bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(239,244,255,0.98))] font-mono text-sm leading-6 text-[var(--foreground)]"
          />
        </ToolResult>

        <ToolResult title="Generated JSON-LD">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">Structured data based on the selected preset mode.</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void copyToClipboard(jsonLd, "jsonld")}>
              {copyState === "jsonld" ? "Copied" : "Copy JSON-LD"}
            </Button>
          </div>
          <Textarea
            readOnly
            value={`<script type="application/ld+json">\n${jsonLd}\n</script>`}
            className="min-h-[320px] border-[var(--outline-strong)] bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(239,244,255,0.98))] font-mono text-sm leading-6 text-[var(--foreground)]"
          />
        </ToolResult>
      </div>
    </div>
  );
}
