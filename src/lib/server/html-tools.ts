import { load, type CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

export type ReadableHtmlBlock = {
  type: "heading" | "paragraph" | "list-item" | "quote" | "code" | "table";
  text: string;
  level?: number;
};

export type ReadableHtmlReport = {
  title: string;
  description: string;
  canonical: string;
  language: string;
  headings: number;
  paragraphs: number;
  words: number;
  blocks: ReadableHtmlBlock[];
  content: string;
};

function normalizeInlineText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

function normalizeCodeText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/^\n+|\n+$/g, "")
    .replace(/[ \t]+$/gm, "");
}

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

function chooseContentRoot($: CheerioAPI): Element {
  const candidates = $("main, article, [role='main']")
    .toArray()
    .map((element) => ({
      element,
      length: normalizeInlineText($(element).text()).length,
    }))
    .sort((left, right) => right.length - left.length);

  return candidates[0]?.element ?? $("body").get(0) ?? $.root().get(0)!;
}

function tableText($: CheerioAPI, element: Element) {
  return $(element)
    .find("tr")
    .toArray()
    .map((row) =>
      $(row)
        .find("th, td")
        .toArray()
        .map((cell) => normalizeInlineText($(cell).text()))
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean)
    .join("\n");
}

export function extractReadableHtml(html: string): ReadableHtmlReport {
  const $ = load(html);
  const title = normalizeInlineText(
    $("meta[property='og:title']").attr("content") ?? $("title").first().text(),
  );
  const description = normalizeInlineText(
    $("meta[name='description']").attr("content") ??
      $("meta[property='og:description']").attr("content") ??
      "",
  );
  const canonical = normalizeInlineText(
    $("link[rel='canonical']").attr("href") ?? "",
  );
  const language = normalizeInlineText($("html").attr("lang") ?? "");

  const root = chooseContentRoot($);
  $(root)
    .find(
      "script, style, noscript, template, svg, canvas, iframe, nav, footer, header, form, dialog, [aria-hidden='true']",
    )
    .remove();

  const blocks: ReadableHtmlBlock[] = [];
  const seen = new Set<string>();
  const blockElements = $(root)
    .find("h1, h2, h3, h4, h5, h6, p, blockquote, pre, li, table")
    .toArray();

  for (const element of blockElements) {
    if (blocks.length >= 200) break;
    const tag = element.tagName.toLowerCase();
    if (
      $(element).parents("table").length &&
      tag !== "table"
    ) {
      continue;
    }
    if (
      (tag === "p" || tag === "li") &&
      $(element).parents("pre, blockquote").length
    ) {
      continue;
    }

    const text =
      tag === "table"
        ? tableText($, element)
        : tag === "pre"
          ? normalizeCodeText($(element).text())
          : normalizeInlineText($(element).text());
    if (!text || text.length < (tag === "p" ? 2 : 1)) continue;

    const dedupeKey = `${tag}:${text}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    if (/^h[1-6]$/.test(tag)) {
      blocks.push({
        type: "heading",
        level: Number(tag.slice(1)),
        text,
      });
    } else if (tag === "li") {
      blocks.push({ type: "list-item", text });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", text });
    } else if (tag === "pre") {
      blocks.push({ type: "code", text });
    } else if (tag === "table") {
      blocks.push({ type: "table", text });
    } else {
      blocks.push({ type: "paragraph", text });
    }
  }

  if (!blocks.length) {
    const fallback = normalizeInlineText($(root).text());
    if (fallback) blocks.push({ type: "paragraph", text: fallback });
  }

  const content = blocks
    .map((block) => {
      if (block.type === "heading") {
        return `${"#".repeat(block.level ?? 2)} ${block.text}`;
      }
      if (block.type === "list-item") return `- ${block.text}`;
      if (block.type === "quote") return `> ${block.text}`;
      if (block.type === "code") return `\`\`\`\n${block.text}\n\`\`\``;
      return block.text;
    })
    .join("\n\n");

  return {
    title,
    description,
    canonical,
    language,
    headings: blocks.filter((block) => block.type === "heading").length,
    paragraphs: blocks.filter((block) => block.type === "paragraph").length,
    words: countWords(
      blocks
        .filter((block) => block.type !== "code")
        .map((block) => block.text)
        .join(" "),
    ),
    blocks,
    content,
  };
}

export function extractPageLinks(html: string, baseUrl: string, limit = 100) {
  const $ = load(html);
  const links = new Set<string>();

  $("a[href]").each((_index, element) => {
    if (links.size >= limit) return false;
    const href = $(element).attr("href")?.trim();
    if (!href || href.startsWith("#")) return;
    try {
      const url = new URL(href, baseUrl);
      if (!["http:", "https:"].includes(url.protocol)) return;
      url.hash = "";
      links.add(url.toString());
    } catch {}
  });

  return [...links];
}
