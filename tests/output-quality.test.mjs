import test from "node:test";
import assert from "node:assert/strict";

import {
  extractPageLinks,
  extractReadableHtml,
} from "../src/lib/server/html-tools.ts";
import {
  extractPdfPageText,
} from "../src/lib/tools/pdf-text.ts";
import {
  minifyCss,
  minifyJavascript,
} from "../src/lib/tools/code-minify.ts";
import {
  buildJsonLd,
  buildMetaTags,
} from "../src/lib/tools/meta-tags.ts";
import { parseCsv } from "../src/lib/tools/csv.ts";
import { classifyLinkStatus } from "../src/lib/server/link-status.ts";

test("link checks distinguish confirmed missing pages from temporary access failures", () => {
  assert.equal(classifyLinkStatus(200), "working");
  assert.equal(classifyLinkStatus(301), "working");
  assert.equal(classifyLinkStatus(404), "broken");
  assert.equal(classifyLinkStatus(410), "broken");
  assert.equal(classifyLinkStatus(403), "unverified");
  assert.equal(classifyLinkStatus(429), "unverified");
  assert.equal(classifyLinkStatus(500), "unverified");
  assert.equal(classifyLinkStatus(0), "unverified");
});

test("HTML extraction uses document structure and excludes navigation noise", () => {
  const html = `<!doctype html>
    <html lang="en">
      <head>
        <title>Example &amp; Test</title>
        <meta name="description" content="A useful &amp; accurate description">
        <link rel="canonical" href="https://example.com/article">
      </head>
      <body>
        <nav><p>Navigation should not be extracted</p></nav>
        <main>
          <h1>Real <span>heading</span></h1>
          <p>Nested <strong>content</strong> &amp; decoded entities.</p>
          <ul><li>First item</li><li>Second item</li></ul>
          <table><tr><th>Name</th><th>Value</th></tr><tr><td>Alpha</td><td>42</td></tr></table>
          <script>garbage()</script>
        </main>
      </body>
    </html>`;
  const report = extractReadableHtml(html);

  assert.equal(report.title, "Example & Test");
  assert.equal(report.description, "A useful & accurate description");
  assert.equal(report.canonical, "https://example.com/article");
  assert.match(report.content, /# Real heading/);
  assert.match(report.content, /Nested content & decoded entities\./);
  assert.match(report.content, /- First item/);
  assert.match(report.content, /Name \| Value\nAlpha \| 42/);
  assert.doesNotMatch(report.content, /Navigation|garbage/);
});

test("HTML link extraction resolves relative links and rejects non-web schemes", () => {
  const links = extractPageLinks(
    `<a href="/about">About</a>
     <a href="https://example.org/page#part">External</a>
     <a href="mailto:test@example.com">Email</a>
     <a href="javascript:alert(1)">Bad</a>`,
    "https://example.com/start",
  );

  assert.deepEqual(links, [
    "https://example.com/about",
    "https://example.org/page",
  ]);
});

test("PDF text reconstruction restores lines, spaces, and hyphenated words", () => {
  const result = extractPdfPageText(
    [
      {
        str: "A reliable",
        transform: [1, 0, 0, 12, 20, 100],
        width: 50,
        height: 12,
      },
      {
        str: "PDF",
        transform: [1, 0, 0, 12, 76, 100],
        width: 20,
        height: 12,
        hasEOL: true,
      },
      {
        str: "inter-",
        transform: [1, 0, 0, 12, 20, 84],
        width: 30,
        height: 12,
        hasEOL: true,
      },
      {
        str: "national result.",
        transform: [1, 0, 0, 12, 20, 68],
        width: 85,
        height: 12,
      },
    ],
    { mode: "reading-order", joinHyphenated: true },
  );

  assert.equal(result.text, "A reliable PDF\ninternational result.");
  assert.equal(result.items, 4);
  assert.equal(result.words, 5);
});

test("standards-aware minifiers preserve executable JavaScript and valid CSS", async () => {
  const javascript = `
    /*! keep */
    function matchesUrl(value) {
      const expression = /https?:\\/\\/[^\\s]+/;
      return expression.test(value);
    }
  `;
  const minifiedJavascript = await minifyJavascript(javascript, {
    mangle: false,
  });
  const matches = new Function(
    `${minifiedJavascript}; return matchesUrl("https://example.com/a");`,
  );
  assert.equal(matches(), true);
  assert.match(minifiedJavascript, /\/\*! keep \*\//);

  const css = `
    /*! license */
    :root { --gap: calc(10px + 2vw); }
    .card::before { content: "/* not a comment */"; margin: var(--gap); }
  `;
  const minifiedCss = minifyCss(css, { restructure: true });
  assert.match(minifiedCss, /\/\*! license \*\//);
  assert.match(minifiedCss, /content:"\/\* not a comment \*\/"/);
  assert.match(minifiedCss, /var\(--gap\)/);
});

test("metadata output escapes HTML and emits schema matching the selected type", () => {
  const options = {
    title: `A </title><script>alert("x")</script> title`,
    description: "Accurate page description",
    canonicalUrl: `https://example.com/product?x="test"`,
    imageUrl: "https://example.com/card.jpg",
    imageAlt: "Product preview",
    imageWidth: "1200",
    imageHeight: "630",
    siteName: "Example",
    type: "product",
    locale: "en_US",
    robots: "index, follow",
    twitterCard: "summary_large_image",
    twitterSite: "@example",
    twitterCreator: "@author",
    author: "Ada",
  };
  const tags = buildMetaTags(options, { includeDocumentTags: true });
  assert.doesNotMatch(tags, /<script>alert/);
  assert.match(tags, /&lt;\/title&gt;&lt;script&gt;/);
  assert.match(tags, /&quot;test&quot;/);
  assert.match(tags, /og:image:secure_url/);

  const jsonLd = buildJsonLd("product", options, {
    datePublished: "",
    dateModified: "",
    productBrand: "Example Brand",
    productSku: "SKU-42",
    productPrice: "49.00",
    priceCurrency: "USD",
    availability: "InStock",
    applicationCategory: "UtilitiesApplication",
  });
  const parsed = JSON.parse(jsonLd);
  assert.equal(parsed["@type"], "Product");
  assert.equal(parsed.brand.name, "Example Brand");
  assert.equal(parsed.offers.price, "49.00");
  assert.doesNotMatch(jsonLd, /<\/script>/);
});

test("CSV conversion detects delimiters, preserves quoted fields, and rejects ambiguous headers", () => {
  const parsed = parseCsv(
    '\uFEFFname;active;count;note\n"Ada; Lovelace";true;42;"Line one\nLine two"',
    { inferTypes: true },
  );

  assert.equal(parsed.delimiter, ";");
  assert.deepEqual(parsed.records, [
    {
      name: "Ada; Lovelace",
      active: true,
      count: 42,
      note: "Line one\nLine two",
    },
  ]);
  assert.throws(
    () => parseCsv("name,Name\nAda,Lovelace"),
    /header “name” is duplicated/i,
  );
  assert.throws(
    () => parseCsv("name,email\nAda\nLinus,linus@example.com"),
    /Row 2 has 1 column; expected 2/,
  );
});
