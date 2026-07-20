import { readFileSync } from "node:fs";

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function collectTypes(value, types = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTypes(item, types));
    return types;
  }
  if (!value || typeof value !== "object") return types;
  if (typeof value["@type"] === "string") types.push(value["@type"]);
  Object.values(value).forEach((item) => collectTypes(item, types));
  return types;
}

for (const filePath of process.argv.slice(2)) {
  const html = readFileSync(filePath, "utf8");
  const title = decodeHtml(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? "");
  const canonical = decodeHtml(
    html.match(/<link rel="canonical" href="([^"]+)"/s)?.[1] ?? "",
  );
  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]));
  const types = [...new Set(jsonLdBlocks.flatMap((block) => collectTypes(block)))];
  const issues = [];

  if (!canonical.startsWith("https://www.webutilia.com")) issues.push("unexpected canonical");
  if (/ToolsWebsite|toolswebsite\.example|localhost/i.test(html)) issues.push("stale identity");
  if (types.includes("SoftwareApplication") || types.includes("WebApplication")) {
    issues.push("ineligible application rich-result type");
  }

  console.log(JSON.stringify({ filePath, title, canonical, jsonLdTypes: types, issues }));
}
