import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("production SEO defaults use the canonical Webutilia identity", () => {
  const metadata = source("src/lib/seo/metadata.ts");
  const layout = source("src/app/layout.tsx");

  assert.match(metadata, /https:\/\/www\.webutilia\.com/);
  assert.doesNotMatch(metadata, /ToolsWebsite/);
  assert.doesNotMatch(metadata, /keywords: options/);
  assert.match(layout, /"@type": "Organization"/);
  assert.match(layout, /"@id": `\$\{siteUrl\}\/\#organization`/);
  assert.match(layout, /"@type": "WebSite"/);
  assert.match(layout, /"@id": `\$\{siteUrl\}\/\#website`/);
});

test("tool pages use truthful page schema instead of ineligible app rich-result markup", () => {
  const toolShell = source("src/components/tool/ToolShell.tsx");

  assert.match(toolShell, /"@type": "WebPage"/);
  assert.match(toolShell, /"@type": "BreadcrumbList"/);
  assert.match(toolShell, /"@type": "HowTo"/);
  assert.match(toolShell, /"@type": "FAQPage"/);
  assert.doesNotMatch(toolShell, /"@type": "(?:SoftwareApplication|WebApplication)"/);
  assert.doesNotMatch(toolShell, /aggregateRating|"review"/);
});

test("collection item lists identify linked items with Schema.org item properties", () => {
  for (const relativePath of ["src/app/page.tsx", "src/components/tool/CategoryBrowser.tsx"]) {
    const content = source(relativePath);
    assert.match(content, /item: `\$\{siteUrl\}\$\{tool\.href\}`/);
    assert.doesNotMatch(content, /url: `\$\{siteUrl\}\$\{tool\.href\}`/);
  }
});

test("the SEO generator avoids incomplete rich-result presets and old placeholder branding", () => {
  const generator = source("src/components/tool/MetaTagGeneratorTool.tsx");

  assert.doesNotMatch(generator, /jsonLdType: "(?:Product|SoftwareApplication)"/);
  assert.doesNotMatch(generator, /toolswebsite\.example|meta name="keywords"/);
  assert.match(generator, /incomplete rich-result claims/);
});
