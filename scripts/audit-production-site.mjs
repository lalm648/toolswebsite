import { extractToolDefinitions } from "./audit-tool-registry.mjs";

const baseUrl = new URL(process.argv[2] || "http://127.0.0.1:3100");
const canonicalOrigin = "https://www.webutilia.com";
const issues = [];
const warnings = [];
const pageRecords = [];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizePath(value) {
  const url = new URL(value, baseUrl);
  const normalized = url.pathname !== "/" ? url.pathname.replace(/\/$/, "") : "/";
  return `${normalized}${url.search}`;
}

function extractAttribute(html, element, attribute, expectedValue, targetAttribute) {
  const tags = html.match(new RegExp(`<${element}\\b[^>]*>`, "gi")) ?? [];
  for (const tag of tags) {
    const expected = tag.match(new RegExp(`${attribute}=["']([^"']*)["']`, "i"))?.[1];
    if (expected?.toLowerCase() !== expectedValue.toLowerCase()) continue;
    return decodeHtml(
      tag.match(new RegExp(`${targetAttribute}=["']([^"']*)["']`, "i"))?.[1] ?? "",
    );
  }
  return "";
}

function extractInternalLinks(html) {
  const links = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const href = decodeHtml(match[1]);
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const url = new URL(href, baseUrl);
    if (url.origin !== baseUrl.origin && url.origin !== canonicalOrigin) continue;
    if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) continue;
    links.add(normalizePath(url));
  }
  return links;
}

function collectSchemaTypes(value, result = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  if (typeof value["@type"] === "string") result.push(value["@type"]);
  Object.values(value).forEach((item) => collectSchemaTypes(item, result));
  return result;
}

async function fetchPath(pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, { redirect: "follow" });
  return { response, body: await response.text() };
}

const { response: sitemapResponse, body: sitemap } = await fetchPath("/sitemap.xml");
if (!sitemapResponse.ok) issues.push(`/sitemap.xml returned ${sitemapResponse.status}`);
const sitemapPaths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
  normalizePath(decodeHtml(match[1])),
);
const expectedSitemapEntries = extractToolDefinitions().length + 14;
if (sitemapPaths.length !== expectedSitemapEntries) {
  issues.push(`sitemap has ${sitemapPaths.length} URLs; expected ${expectedSitemapEntries}`);
}
if (new Set(sitemapPaths).size !== sitemapPaths.length) issues.push("sitemap contains duplicate URLs");

const queue = [...new Set(["/", ...sitemapPaths])];
const queued = new Set(queue);
const visited = new Set();

while (queue.length) {
  const pathname = queue.shift();
  if (!pathname || visited.has(pathname)) continue;
  visited.add(pathname);

  let response;
  let html;
  try {
    ({ response, body: html } = await fetchPath(pathname));
  } catch (error) {
    issues.push(`${pathname} could not be fetched: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }

  if (!response.ok) {
    issues.push(`${pathname} returned ${response.status}`);
    continue;
  }
  if (!response.headers.get("content-type")?.includes("text/html")) continue;

  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "").trim();
  const description = extractAttribute(html, "meta", "name", "description", "content").trim();
  const canonical = extractAttribute(html, "link", "rel", "canonical", "href").trim();
  const robots = extractAttribute(html, "meta", "name", "robots", "content").trim();
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const missingAltCount = imageTags.filter((tag) => !/\balt=["'][^"']*["']/i.test(tag)).length;
  const schemaTypes = [];

  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      collectSchemaTypes(JSON.parse(match[1]), schemaTypes);
    } catch (error) {
      issues.push(`${pathname} contains invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!title) issues.push(`${pathname} has no title`);
  if (!description) issues.push(`${pathname} has no meta description`);
  if (!canonical) {
    issues.push(`${pathname} has no canonical URL`);
  } else {
    const canonicalUrl = new URL(canonical);
    if (canonicalUrl.origin !== canonicalOrigin) issues.push(`${pathname} has unexpected canonical origin ${canonicalUrl.origin}`);
    if (normalizePath(canonicalUrl) !== pathname) issues.push(`${pathname} canonical points to ${normalizePath(canonicalUrl)}`);
  }
  if (robots && /noindex/i.test(robots)) issues.push(`${pathname} is unexpectedly noindex`);
  if (h1Count !== 1) issues.push(`${pathname} has ${h1Count} H1 elements`);
  if (missingAltCount) issues.push(`${pathname} has ${missingAltCount} image elements without alt attributes`);
  if (!schemaTypes.includes("Organization") || !schemaTypes.includes("WebSite")) {
    issues.push(`${pathname} is missing global Organization or WebSite schema`);
  }
  if (schemaTypes.includes("SoftwareApplication") || schemaTypes.includes("WebApplication")) {
    issues.push(`${pathname} contains ineligible application rich-result markup`);
  }
  if (/<meta\b[^>]*name=["']keywords["']/i.test(html)) issues.push(`${pathname} emits a meta keywords tag`);
  if (/ToolsWebsite|toolswebsite\.example|contact@example\.com|localhost:3000|\[object Object\]/i.test(html)) {
    issues.push(`${pathname} contains stale, example, or malformed production content`);
  }
  if (!/<html\b[^>]*lang=["']en["']/i.test(html)) issues.push(`${pathname} does not declare English as the document language`);

  pageRecords.push({ pathname, title, description, canonical, schemaTypes: [...new Set(schemaTypes)] });

  for (const linkedPath of extractInternalLinks(html)) {
    if (!queued.has(linkedPath)) {
      queued.add(linkedPath);
      queue.push(linkedPath);
    }
  }
}

for (const field of ["title", "canonical"]) {
  const seen = new Map();
  for (const page of pageRecords) {
    const value = page[field];
    if (!value) continue;
    if (seen.has(value)) issues.push(`${page.pathname} duplicates ${field} from ${seen.get(value)}`);
    else seen.set(value, page.pathname);
  }
}

for (const sitemapPath of sitemapPaths) {
  if (!visited.has(sitemapPath)) issues.push(`${sitemapPath} from sitemap was not crawled`);
}

const { response: robotsResponse, body: robotsBody } = await fetchPath("/robots.txt");
if (!robotsResponse.ok) issues.push(`/robots.txt returned ${robotsResponse.status}`);
if (!robotsBody.includes(`${canonicalOrigin}/sitemap.xml`)) issues.push("robots.txt does not advertise the canonical sitemap");
if (/Disallow:\s*\//i.test(robotsBody)) issues.push("robots.txt blocks the production site");

for (const asset of [
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/webutilia-logo.png",
  "/manifest.webmanifest",
  "/api/og?title=Webutilia",
]) {
  const { response } = await fetchPath(asset);
  if (!response.ok) issues.push(`${asset} returned ${response.status}`);
}

if (pageRecords.length !== sitemapPaths.length) {
  warnings.push(`crawled ${pageRecords.length} HTML pages for ${sitemapPaths.length} sitemap URLs`);
}

const report = {
  baseUrl: baseUrl.origin,
  sitemapUrls: sitemapPaths.length,
  htmlPages: pageRecords.length,
  discoveredInternalRoutes: visited.size,
  uniqueTitles: new Set(pageRecords.map((page) => page.title)).size,
  uniqueCanonicals: new Set(pageRecords.map((page) => page.canonical)).size,
  issues,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exitCode = 1;
