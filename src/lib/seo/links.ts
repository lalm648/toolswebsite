import {
  getCategoryBySlug,
  getToolBySlug,
  type ToolCategorySlug,
  type ToolDefinition,
} from "@/lib/data/tools";

export type SeoLink = {
  href: string;
  label: string;
  description: string;
  external?: boolean;
};

const workflowSlugs: Record<ToolCategorySlug, string[]> = {
  image: [
    "image-compressor",
    "image-resizer",
    "format-converter",
    "smart-image-cropper",
    "metadata-stripper",
  ],
  video: [
    "video-compressor",
    "video-format-transpiler",
    "video-clipper",
    "thumbnail-grabber",
    "audio-extractor",
  ],
  audio: [
    "audio-format-switcher",
    "audio-joiner",
    "volume-normalizer",
    "bpm-detector",
    "voice-recorder",
  ],
  document: [
    "pdf-merger",
    "pdf-splitter",
    "image-to-pdf",
    "pdf-text-extractor",
    "file-word-counter",
  ],
  text: [
    "word-counter",
    "case-converter",
    "remove-extra-spaces",
    "remove-duplicate-lines",
    "remove-line-breaks",
  ],
  developer: [
    "json-formatter",
    "csv-to-json",
    "regex-tester",
    "code-minifier",
    "diff-checker",
  ],
  security: [
    "password-generator",
    "hash-calculator",
    "uuid-generator",
    "qr-code-generator",
    "barcode-generator",
  ],
  network: [
    "broken-link-checker",
    "sitemap-builder",
    "dns-inspector",
    "ping-monitor",
    "whois-lookup",
  ],
  seo: [
    "meta-tag-generator",
    "broken-link-checker",
    "sitemap-builder",
    "image-compressor",
    "favicon-generator",
  ],
  // One tool in the category, so the useful neighbours are the text utilities a
  // reader of a bilingual glossary actually reaches for next.
  dictionary: [
    "brahui-dictionary",
    "word-counter",
    "case-converter",
    "remove-duplicate-lines",
  ],
};

export const trustedResources: Record<ToolCategorySlug, SeoLink[]> = {
  image: [
    {
      href: "https://web.dev/learn/performance/image-performance",
      label: "Image performance guidance",
      description: "Google's web.dev guidance for sizing and delivering efficient images.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API",
      label: "Canvas API reference",
      description: "MDN's reference for browser-based image drawing and processing.",
      external: true,
    },
  ],
  video: [
    {
      href: "https://ffmpeg.org/ffmpeg-formats.html",
      label: "FFmpeg formats documentation",
      description: "The official reference for supported media containers and formats.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats",
      label: "Web media format guide",
      description: "MDN guidance for browser audio and video compatibility.",
      external: true,
    },
  ],
  audio: [
    {
      href: "https://ffmpeg.org/ffmpeg-formats.html",
      label: "FFmpeg formats documentation",
      description: "The official reference for audio containers, muxers, and demuxers.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API",
      label: "Web Audio API reference",
      description: "MDN's guide to audio processing in modern browsers.",
      external: true,
    },
  ],
  document: [
    {
      href: "https://pdf-lib.js.org/docs/api/",
      label: "PDF-lib API documentation",
      description: "The library reference behind local PDF creation and editing workflows.",
      external: true,
    },
    {
      href: "https://www.w3.org/TR/FileAPI/",
      label: "W3C File API specification",
      description: "The web standard for selecting and accessing files in browser applications.",
      external: true,
    },
  ],
  text: [
    {
      href: "https://www.w3.org/International/questions/qa-html-language-declarations",
      label: "W3C language guidance",
      description: "Practical guidance for declaring the language of web content.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl",
      label: "Intl reference",
      description: "MDN's reference for language-sensitive text operations.",
      external: true,
    },
  ],
  developer: [
    {
      href: "https://www.rfc-editor.org/rfc/rfc8259",
      label: "JSON standard (RFC 8259)",
      description: "The Internet standard that defines JSON syntax and interoperability.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON",
      label: "JavaScript JSON reference",
      description: "MDN's reference for parsing and serializing JSON.",
      external: true,
    },
  ],
  security: [
    {
      href: "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html",
      label: "OWASP cryptographic guidance",
      description: "Security guidance for random generation, hashing, encryption, and key handling.",
      external: true,
    },
    {
      href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API",
      label: "Web Crypto API reference",
      description: "MDN's reference for cryptographic operations in the browser.",
      external: true,
    },
  ],
  network: [
    {
      href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
      label: "Google sitemap guidance",
      description: "Google's guidance for discovery, crawling, and sitemap usage.",
      external: true,
    },
    {
      href: "https://www.icann.org/rdap",
      label: "ICANN RDAP information",
      description: "Official information about the modern domain registration data protocol.",
      external: true,
    },
  ],
  seo: [
    {
      href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
      label: "Google SEO Starter Guide",
      description: "Google's official fundamentals for crawlable, useful search content.",
      external: true,
    },
    {
      href: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
      label: "Structured data introduction",
      description: "Google's guidance for describing page entities with structured data.",
      external: true,
    },
  ],
  dictionary: [
    {
      href: "https://iso639-3.sil.org/code/brh",
      label: "ISO 639-3: brh",
      description: "The registered language code for Brahui, used to tag Brahui text on the page.",
      external: true,
    },
    {
      href: "https://creativecommons.org/licenses/by/4.0/",
      label: "CC BY 4.0 licence",
      description:
        "The licence the source glossary is published under, which is what allows this extraction to be redistributed with attribution.",
      external: true,
    },
  ],
};

const categorySteps: Record<ToolCategorySlug, [string, string, string]> = {
  image: ["Add the image or images you want to process.", "Choose the output, dimensions, or editing options you need.", "Preview the result, then download the new image file."],
  video: ["Choose a supported video from your device.", "Set the conversion or editing controls for the result.", "Run the local process, review the output, and download it."],
  audio: ["Choose a supported audio file or enable recording when required.", "Configure the format or audio adjustment.", "Process the audio locally, listen to the result, and save it."],
  document: ["Add the document or source files in the order you need.", "Choose the pages, format, or document options.", "Create the result locally and download the finished file."],
  text: ["Paste or type the text you want to work with.", "Apply the cleanup, counting, or formatting action.", "Review and copy the finished text into your next workflow."],
  developer: ["Paste the source data or code into the input.", "Choose the transformation or validation option.", "Check the output, then copy the result for your project."],
  security: ["Enter the non-sensitive input or choose the generation settings.", "Generate or calculate the result in your browser.", "Copy or download the output and store it appropriately."],
  network: ["Enter a public URL, domain, or authorized host.", "Choose the diagnostic you need and confirm authorization where requested.", "Review the returned records, status, or response details."],
  seo: ["Add the page title, description, canonical URL, and sharing details.", "Review the search and social previews for missing or weak fields.", "Copy the generated tags into the page head and validate the live URL."],
  dictionary: ["Search a word in English, romanised Brahui, or Urdu script — or browse the A–Z list.", "Open an entry to read its senses, part of speech, and cited example sentences.", "Play the pronunciation, and add the word to a study deck to practise it."],
};

// "Add content to…", "Configure the result", "Review and export" describes a file
// converter. A reference tool is looked up, read and practised, and the HowTo
// structured data built from these names is published, so it has to be accurate.
const categoryStepNames: Partial<Record<ToolCategorySlug, [string, string, string]>> = {
  dictionary: ["Find the word", "Read the entry", "Hear it and practise it"],
};

export function getToolSteps(tool: ToolDefinition) {
  const names = categoryStepNames[tool.category];

  return categorySteps[tool.category].map((text, index) => ({
    name:
      names?.[index] ??
      (index === 0
        ? `Add content to ${tool.title}`
        : index === 1
          ? "Configure the result"
          : "Review and export"),
    text,
  }));
}

export function getToolTips(tool: ToolDefinition) {
  // The generic tips are written for a file-in, file-out utility. A dictionary has
  // no input file, no output size and nothing to publish, so the fallbacks below
  // would have printed three sentences of nonsense on the page.
  if (tool.category === "dictionary") {
    return [
      "Search with plain ASCII if the diacritics are awkward to type — 'tuus' finds 'tús'.",
      "Read the example sentences, not only the gloss: they show which sense is actually used.",
      "Learn the frequency-ordered decks first. The commonest words are the ones you cannot read a sentence without.",
    ];
  }

  const privacyTip = ["network"].includes(tool.category)
    ? "Only run network diagnostics against public systems you own or are authorized to test."
    : "Keep the original input until you have checked the downloaded or copied result.";

  return [
    `Start with a representative sample before running a large ${tool.title.toLowerCase()} workflow.`,
    privacyTip,
    "Review quality, compatibility, and output size before publishing or sharing the result.",
  ];
}

export function getContextualInternalLinks(tool: ToolDefinition): SeoLink[] {
  const category = getCategoryBySlug(tool.category);
  const candidates = workflowSlugs[tool.category]
    .filter((slug) => slug !== tool.slug)
    .map((slug) => getToolBySlug(slug))
    .filter((item): item is ToolDefinition => Boolean(item))
    .slice(0, 4)
    .map((item) => ({
      href: item.href,
      label: item.title,
      description: item.description,
    }));

  return [
    ...(category
      ? [{ href: category.href, label: `All ${category.title}`, description: category.description }]
      : []),
    ...candidates,
  ];
}

export function getCategoryInternalLinks(categorySlug: ToolCategorySlug): SeoLink[] {
  return workflowSlugs[categorySlug]
    .map((slug) => getToolBySlug(slug))
    .filter((item): item is ToolDefinition => Boolean(item))
    .slice(0, 5)
    .map((item) => ({
      href: item.href,
      label: item.title,
      description: item.description,
    }));
}
