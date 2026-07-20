import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

export function extractToolDefinitions(source = read("src/lib/data/tools.ts")) {
  const section = source.split("export const tools: ToolDefinition[] = [")[1]?.split("];\n\nexport function")[0] ?? "";
  const tools = [];
  const expression = /\{\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)",[\s\S]*?href:\s*"([^"]+)",\s*category:\s*"([^"]+)"[\s\S]*?\},/g;
  let match;
  while ((match = expression.exec(section))) {
    tools.push({ slug: match[1], title: match[2], href: match[3], category: match[4] });
  }
  return tools;
}

export function auditToolRegistry() {
  const tools = extractToolDefinitions();
  const failures = [];
  const warnings = [];
  const unique = (field) => {
    const values = new Set();
    for (const tool of tools) {
      if (values.has(tool[field])) failures.push(`Duplicate ${field}: ${tool[field]}`);
      values.add(tool[field]);
    }
  };
  unique("slug");
  unique("title");
  unique("href");

  const workbenchByCategory = {
    image: "src/components/tool/extended/ImageUtilityWorkbench.tsx",
    video: "src/components/tool/extended/MediaUtilityWorkbench.tsx",
    audio: "src/components/tool/extended/MediaUtilityWorkbench.tsx",
    document: "src/components/tool/extended/DocumentUtilityWorkbench.tsx",
    developer: "src/components/tool/extended/DataUtilityWorkbench.tsx",
    security: "src/components/tool/extended/GeneratorUtilityWorkbench.tsx",
    network: "src/components/tool/extended/NetworkUtilityWorkbench.tsx",
  };

  let dedicated = 0;
  let extended = 0;
  for (const tool of tools) {
    const expectedHref = `/tools/${tool.category}/${tool.slug}`;
    if (tool.href !== expectedHref) failures.push(`${tool.slug} has unexpected href ${tool.href}`);
    const dedicatedPage = join(projectRoot, "src/app", tool.href, "page.tsx");
    if (existsSync(dedicatedPage)) {
      dedicated += 1;
      continue;
    }
    const workbench = workbenchByCategory[tool.category];
    if (!workbench) {
      failures.push(`${tool.slug} has neither a dedicated page nor an extended workbench`);
      continue;
    }
    extended += 1;
    const implementationSource =
      tool.category === "network"
        ? `${read(workbench)}\n${read("src/app/api/network-tools/route.ts")}`
        : read(workbench);
    if (!implementationSource.includes(`"${tool.slug}"`)) {
      failures.push(`${tool.slug} is not referenced by ${workbench}`);
    }
  }

  const sitemap = read("src/app/sitemap.ts");
  if (!sitemap.includes("...tools.map")) failures.push("Sitemap does not enumerate the tool registry");
  const dynamicRoute = read("src/app/tools/[category]/[slug]/page.tsx");
  if (!dynamicRoute.includes("generateStaticParams")) failures.push("Extended tool route is not statically enumerated");
  if (!dynamicRoute.includes("buildToolMetadata")) failures.push("Extended tool route is missing tool metadata");
  if (!existsSync(join(projectRoot, "public/ffmpeg/ffmpeg-core.js")) || !existsSync(join(projectRoot, "public/ffmpeg/ffmpeg-core.wasm"))) {
    failures.push("Local FFmpeg runtime assets are missing");
  }
  if (!existsSync(join(projectRoot, "src/components/CompleteToolIndex.tsx"))) {
    failures.push("Homepage complete tool index is missing");
  }
  if (tools.length < 60) warnings.push(`Only ${tools.length} tools are registered; review public count claims`);

  const categoryCounts = Object.fromEntries(
    [...new Set(tools.map((tool) => tool.category))].sort().map((category) => [
      category,
      tools.filter((tool) => tool.category === category).length,
    ]),
  );
  return { tools: tools.length, dedicated, extended, categoryCounts, failures, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = auditToolRegistry();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
