"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent, trackToolFailure } from "@/lib/analytics";
import {
  buildJsonLd,
  buildMetaTags,
  isAbsoluteHttpUrl,
  type MetaPresetMode,
  type MetaTagOptions,
  type SchemaDetails,
} from "@/lib/tools/meta-tags";

type PresetMode = MetaPresetMode;

type LocalImagePreview = {
  fileName: string;
  url: string;
  width: number;
  height: number;
};

type WarningItem = {
  level: "error" | "warning" | "info";
  message: string;
};

type PresetConfig = {
  label: string;
  badge: string;
  type: string;
  robots: string;
  twitterCard: string;
  keywords: string;
};

const presetConfigs: Record<PresetMode, PresetConfig> = {
  website: {
    label: "Website",
    badge: "Site-wide SEO",
    type: "website",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "online tools, image tools, developer tools, seo tools",
  },
  article: {
    label: "Article",
    badge: "Editorial SEO",
    type: "article",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "article seo, image optimization, web performance",
  },
  product: {
    label: "Product",
    badge: "Commercial SEO",
    type: "product",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "product seo, saas product, image toolkit",
  },
  tool: {
    label: "Tool Page",
    badge: "Utility SEO",
    type: "website",
    robots: "index, follow, max-image-preview:large",
    twitterCard: "summary_large_image",
    keywords: "jpg to png, image converter, browser tool",
  },
};

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

export default function MetaTagGeneratorTool() {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preset, setPreset] = useState<PresetMode>("website");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageWidth, setImageWidth] = useState("1200");
  const [imageHeight, setImageHeight] = useState("630");
  const [siteName, setSiteName] = useState("");
  const [type, setType] = useState(presetConfigs.website.type);
  const [locale, setLocale] = useState("en_US");
  const [robots, setRobots] = useState(presetConfigs.website.robots);
  const [twitterCard, setTwitterCard] = useState(presetConfigs.website.twitterCard);
  const [twitterSite, setTwitterSite] = useState("");
  const [twitterCreator, setTwitterCreator] = useState("");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState(presetConfigs.website.keywords);
  const [includeDocumentTags, setIncludeDocumentTags] = useState(true);
  const [datePublished, setDatePublished] = useState("");
  const [dateModified, setDateModified] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("USD");
  const [availability, setAvailability] = useState("InStock");
  const [applicationCategory, setApplicationCategory] =
    useState("UtilitiesApplication");
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

  const metaOptions = useMemo<MetaTagOptions>(
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
    ]
  );

  const schemaDetails = useMemo<SchemaDetails>(
    () => ({
      datePublished,
      dateModified,
      productBrand,
      productSku,
      productPrice,
      priceCurrency,
      availability,
      applicationCategory,
    }),
    [
      datePublished,
      dateModified,
      productBrand,
      productSku,
      productPrice,
      priceCurrency,
      availability,
      applicationCategory,
    ],
  );
  const output = useMemo(
    () => buildMetaTags(metaOptions, { includeDocumentTags }),
    [metaOptions, includeDocumentTags],
  );
  const jsonLd = useMemo(
    () => buildJsonLd(preset, metaOptions, schemaDetails),
    [preset, metaOptions, schemaDetails],
  );
  const titleScore = useMemo(() => scoreTitle(title), [title]);
  const descriptionScore = useMemo(() => scoreDescription(description), [description]);

  const warnings = useMemo(() => {
    const items: WarningItem[] = [];

    if (!title.trim()) items.push({ level: "error", message: "Title is required before this output is ready to use." });
    if (!description.trim()) items.push({ level: "error", message: "Description is required before this output is ready to use." });
    if (title.trim().length > 70) items.push({ level: "warning", message: "Title is likely too long for search results." });
    if (description.trim().length > 175)
      items.push({ level: "warning", message: "Description is likely too long and may be truncated." });
    if (!canonicalUrl.trim()) items.push({ level: "error", message: "Canonical URL is required for canonical, Open Graph, and structured-data output." });
    if (canonicalUrl.trim() && !isAbsoluteHttpUrl(canonicalUrl))
      items.push({ level: "error", message: "Canonical URL must be an absolute HTTP or HTTPS URL." });
    if (!imageUrl.trim())
      items.push({ level: "warning", message: "Social image URL is missing. Social previews may be weak without it." });
    if (imageUrl.trim() && !isAbsoluteHttpUrl(imageUrl))
      items.push({ level: "error", message: "Social image URL must be absolute and publicly reachable." });
    if (!imageAlt.trim()) items.push({ level: "info", message: "Add image alt text for richer accessibility and preview metadata." });
    if (!imageWidth.trim() || !imageHeight.trim())
      items.push({ level: "info", message: "Image dimensions help social platforms render previews faster." });
    if (
      (imageWidth.trim() && !/^\d+$/.test(imageWidth)) ||
      (imageHeight.trim() && !/^\d+$/.test(imageHeight))
    )
      items.push({ level: "warning", message: "Image width and height should be positive integers in pixels." });
    if (locale.trim() && !/^[a-z]{2}(?:[_-][A-Z]{2})?$/.test(locale.trim()))
      items.push({ level: "warning", message: "Use a locale such as en_US or en-GB." });
    if (twitterSite.trim() && !/^@[A-Za-z0-9_]{1,15}$/.test(twitterSite.trim()))
      items.push({ level: "warning", message: "Twitter site should be a valid @handle." });
    if (twitterCreator.trim() && !/^@[A-Za-z0-9_]{1,15}$/.test(twitterCreator.trim()))
      items.push({ level: "warning", message: "Twitter creator should be a valid @handle." });
    if (!twitterSite.trim()) items.push({ level: "info", message: "Twitter site handle is optional but useful for branded cards." });
    if (preset === "article") {
      if (!author.trim())
        items.push({ level: "warning", message: "Article schema should identify the visible author." });
      if (!datePublished)
        items.push({ level: "warning", message: "Add the real publication date before using Article schema." });
      if (!imageUrl.trim())
        items.push({ level: "warning", message: "Article schema is stronger with a representative image." });
    }
    if (preset === "product") {
      if (!productBrand.trim())
        items.push({ level: "warning", message: "Add the visible product brand before using Product schema." });
      if (!productPrice.trim())
        items.push({ level: "warning", message: "Add a real visible price, or omit the Product offer entirely." });
      if (productPrice.trim() && !/^\d+(?:\.\d{1,2})?$/.test(productPrice.trim()))
        items.push({ level: "error", message: "Product price must be a plain number such as 49.00." });
      items.push({
        level: "info",
        message: "Do not invent reviews, ratings, availability, or price. Structured data must match visible page content.",
      });
    }
    if (preset === "tool")
      items.push({
        level: "info",
        message: "WebApplication schema describes the tool but does not guarantee a Google rich result. Do not add fabricated ratings.",
      });

    return items;
  }, [
    title,
    description,
    canonicalUrl,
    imageUrl,
    imageAlt,
    imageWidth,
    imageHeight,
    locale,
    twitterSite,
    twitterCreator,
    preset,
    author,
    datePublished,
    productBrand,
    productPrice,
  ]);
  const hasBlockingErrors = warnings.some((item) => item.level === "error");

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
              <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" placeholder="A specific page title for search and sharing" />
              <span className={`mt-2 block text-xs ${titleScore.tone}`}>{title.length} characters · {titleScore.label}</span>
            </label>

            <label className="text-sm font-medium text-[var(--ink-900)]">
              Description
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-28" placeholder="Describe the page accurately in one or two useful sentences." />
              <span className={`mt-2 block text-xs ${descriptionScore.tone}`}>
                {description.length} characters · {descriptionScore.label}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-[var(--ink-900)]">
                Canonical URL
                <Input value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} className="mt-2" placeholder="https://example.com/page" />
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
              Topic phrases for content planning
              <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} className="mt-2" />
              <span className="mt-2 block text-xs leading-5 text-[var(--muted-foreground)]">
                Use these to keep the page focused. They are not emitted as a meta keywords tag.
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3 text-xs leading-5">
              <input
                className="mt-1 accent-[var(--accent-500)]"
                type="checkbox"
                checked={includeDocumentTags}
                onChange={(event) =>
                  setIncludeDocumentTags(event.target.checked)
                }
              />
              <span>
                <strong className="block text-[var(--ink-900)]">
                  Include charset and viewport tags
                </strong>
                Keep enabled when generating a complete starter head block.
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">
                Structured data details
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                These fields generate a real {preset === "tool" ? "WebApplication" : preset[0].toUpperCase() + preset.slice(1)} schema object. Only enter information visible on the page.
              </p>
            </div>
            <Badge className="border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)]">
              {preset === "tool" ? "WebApplication" : presetConfigs[preset].label}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 rounded-[1.2rem] border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 sm:p-5">
            {preset === "article" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-[var(--ink-900)]">
                  Publication date
                  <Input
                    className="mt-2"
                    type="date"
                    value={datePublished}
                    onChange={(event) => setDatePublished(event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-[var(--ink-900)]">
                  Last modified
                  <Input
                    className="mt-2"
                    type="date"
                    value={dateModified}
                    onChange={(event) => setDateModified(event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {preset === "product" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-[var(--ink-900)]">
                    Brand
                    <Input
                      className="mt-2"
                      value={productBrand}
                      onChange={(event) => setProductBrand(event.target.value)}
                    />
                  </label>
                  <label className="text-sm font-medium text-[var(--ink-900)]">
                    SKU <span className="font-normal text-[var(--muted-foreground)]">(optional)</span>
                    <Input
                      className="mt-2"
                      value={productSku}
                      onChange={(event) => setProductSku(event.target.value)}
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-medium text-[var(--ink-900)]">
                    Visible price
                    <Input
                      className="mt-2"
                      inputMode="decimal"
                      value={productPrice}
                      onChange={(event) => setProductPrice(event.target.value)}
                      placeholder="49.00"
                    />
                  </label>
                  <label className="text-sm font-medium text-[var(--ink-900)]">
                    Currency
                    <Input
                      className="mt-2 uppercase"
                      maxLength={3}
                      value={priceCurrency}
                      onChange={(event) =>
                        setPriceCurrency(event.target.value.toUpperCase())
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-[var(--ink-900)]">
                    Availability
                    <select
                      className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
                      value={availability}
                      onChange={(event) => setAvailability(event.target.value)}
                    >
                      <option value="InStock">In stock</option>
                      <option value="OutOfStock">Out of stock</option>
                      <option value="PreOrder">Pre-order</option>
                      <option value="BackOrder">Back order</option>
                    </select>
                  </label>
                </div>
              </>
            ) : null}

            {preset === "tool" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-[var(--ink-900)]">
                  Application category
                  <Input
                    className="mt-2"
                    value={applicationCategory}
                    onChange={(event) =>
                      setApplicationCategory(event.target.value)
                    }
                  />
                </label>
                <label className="text-sm font-medium text-[var(--ink-900)]">
                  Free-offer currency
                  <Input
                    className="mt-2 uppercase"
                    maxLength={3}
                    value={priceCurrency}
                    onChange={(event) =>
                      setPriceCurrency(event.target.value.toUpperCase())
                    }
                  />
                </label>
              </div>
            ) : null}

            {preset === "website" ? (
              <p className="rounded-xl border border-[var(--accent-200)] bg-[var(--accent-50)] p-4 text-xs leading-5 text-[var(--accent-700)]">
                WebSite schema uses the title, description, canonical URL,
                locale, social image, and site name already entered above.
              </p>
            ) : null}
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
                    item.level === "error"
                      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100"
                      : item.level === "warning"
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
          <div className="rounded-[1.35rem] bg-[var(--surface-panel)] p-5 text-left">
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
            <div className="aspect-[1200/630] w-full bg-[var(--surface-panel)]">
              {previewImageSource ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImageSource} alt={imageAlt || "Social preview"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--foreground)]">
                  Social image preview will appear here
                </div>
              )}
            </div>
            <div className="space-y-3 bg-[var(--surface-card)] p-4">
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
            <Button type="button" variant="secondary" size="sm" disabled={hasBlockingErrors} onClick={() => void copyToClipboard(output, "meta")}>
              {copyState === "meta" ? "Copied" : "Copy tags"}
            </Button>
          </div>
          <Textarea
            readOnly
            value={output}
            className="min-h-[360px] border-[var(--outline-strong)] bg-[var(--surface-panel)] font-mono text-sm leading-6 text-[var(--foreground)]"
          />
        </ToolResult>

        <ToolResult title="Generated JSON-LD">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">Structured data based on the selected preset mode.</p>
            <Button type="button" variant="secondary" size="sm" disabled={hasBlockingErrors} onClick={() => void copyToClipboard(jsonLd, "jsonld")}>
              {copyState === "jsonld" ? "Copied" : "Copy JSON-LD"}
            </Button>
          </div>
          <Textarea
            readOnly
            value={`<script type="application/ld+json">\n${jsonLd}\n</script>`}
            className="min-h-[320px] border-[var(--outline-strong)] bg-[var(--surface-panel)] font-mono text-sm leading-6 text-[var(--foreground)]"
          />
        </ToolResult>
      </div>
    </div>
  );
}
