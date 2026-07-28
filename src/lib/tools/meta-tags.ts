export type MetaPresetMode = "website" | "article" | "product" | "tool";

export type MetaTagOptions = {
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
};

export type SchemaDetails = {
  datePublished: string;
  dateModified: string;
  productBrand: string;
  productSku: string;
  productPrice: string;
  priceCurrency: string;
  availability: string;
  applicationCategory: string;
};

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtmlText(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tag(name: string, content: string, attribute = "name") {
  return content.trim()
    ? `<meta ${attribute}="${escapeAttribute(name)}" content="${escapeAttribute(content.trim())}" />`
    : "";
}

export function buildMetaTags(
  options: MetaTagOptions,
  settings: { includeDocumentTags: boolean },
) {
  const lines = [
    settings.includeDocumentTags ? '<meta charset="utf-8" />' : "",
    settings.includeDocumentTags
      ? '<meta name="viewport" content="width=device-width, initial-scale=1" />'
      : "",
    options.title.trim()
      ? `<title>${escapeHtmlText(options.title.trim())}</title>`
      : "",
    tag("description", options.description),
    options.canonicalUrl.trim()
      ? `<link rel="canonical" href="${escapeAttribute(options.canonicalUrl.trim())}" />`
      : "",
    tag("robots", options.robots),
    tag("author", options.author),
    tag("og:title", options.title, "property"),
    tag("og:description", options.description, "property"),
    tag("og:type", options.type, "property"),
    tag("og:url", options.canonicalUrl, "property"),
    tag("og:site_name", options.siteName, "property"),
    tag("og:locale", options.locale, "property"),
    tag("og:image", options.imageUrl, "property"),
    options.imageUrl.trim()
      ? tag("og:image:alt", options.imageAlt, "property")
      : "",
    options.imageUrl.trim()
      ? tag("og:image:width", options.imageWidth, "property")
      : "",
    options.imageUrl.trim()
      ? tag("og:image:height", options.imageHeight, "property")
      : "",
    options.imageUrl.trim().startsWith("https://")
      ? tag("og:image:secure_url", options.imageUrl, "property")
      : "",
    tag("twitter:card", options.twitterCard),
    tag("twitter:title", options.title),
    tag("twitter:description", options.description),
    tag("twitter:site", options.twitterSite),
    tag("twitter:creator", options.twitterCreator),
    tag("twitter:image", options.imageUrl),
    options.imageUrl.trim() ? tag("twitter:image:alt", options.imageAlt) : "",
  ];

  return lines.filter(Boolean).join("\n");
}

function commonSchema(options: MetaTagOptions) {
  return {
    name: options.title.trim() || undefined,
    description: options.description.trim() || undefined,
    url: options.canonicalUrl.trim() || undefined,
    image: options.imageUrl.trim() || undefined,
    inLanguage: options.locale
      ? options.locale.trim().replace("_", "-")
      : undefined,
  };
}

export function buildJsonLd(
  mode: MetaPresetMode,
  options: MetaTagOptions,
  details: SchemaDetails,
) {
  const common = commonSchema(options);
  let schema: Record<string, unknown>;

  if (mode === "article") {
    schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      ...common,
      headline: options.title.trim() || undefined,
      mainEntityOfPage: options.canonicalUrl.trim()
        ? {
            "@type": "WebPage",
            "@id": options.canonicalUrl.trim(),
          }
        : undefined,
      datePublished: details.datePublished || undefined,
      dateModified: details.dateModified || undefined,
      author: options.author.trim()
        ? { "@type": "Person", name: options.author.trim() }
        : undefined,
      publisher: options.siteName.trim()
        ? { "@type": "Organization", name: options.siteName.trim() }
        : undefined,
    };
  } else if (mode === "product") {
    schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      ...common,
      sku: details.productSku || undefined,
      brand: details.productBrand
        ? { "@type": "Brand", name: details.productBrand }
        : undefined,
      offers: details.productPrice
        ? {
            "@type": "Offer",
            url: options.canonicalUrl.trim() || undefined,
            price: details.productPrice,
            priceCurrency: details.priceCurrency || undefined,
            availability: details.availability
              ? `https://schema.org/${details.availability}`
              : undefined,
          }
        : undefined,
    };
  } else if (mode === "tool") {
    schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      ...common,
      applicationCategory:
        details.applicationCategory || "UtilitiesApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: details.priceCurrency || "USD",
      },
      provider: options.siteName.trim()
        ? { "@type": "Organization", name: options.siteName.trim() }
        : undefined,
    };
  } else {
    schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      ...common,
      publisher: options.siteName.trim()
        ? { "@type": "Organization", name: options.siteName.trim() }
        : undefined,
    };
  }

  return JSON.stringify(schema, null, 2).replace(/</g, "\\u003c");
}

export function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
