import {
  lookup,
  resolve4,
  resolve6,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveTxt,
} from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { NextResponse } from "next/server";
import {
  extractPageLinks,
  extractReadableHtml,
} from "@/lib/server/html-tools";
import { classifyLinkStatus } from "@/lib/server/link-status";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lightweight in-memory rate limiter. Zero dependencies so it works on a
// self-hosted single instance without Redis/KV. Prevents the network utilities
// from being abused as an open proxy / port scanner against third parties.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Opportunistically drop expired buckets so the map cannot grow unbounded.
function pruneRateBuckets() {
  if (rateBuckets.size < 5000) return;
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(ip);
  }
}

const allowedPorts = [
  21, 22, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3000, 3306, 5432, 6379,
  8080, 8443,
];

const allowedActions = new Set([
  "html-content-scraper",
  "broken-link-checker",
  "sitemap-builder",
  "dns-inspector",
  "port-scanner",
  "ping-monitor",
  "whois-lookup",
]);

function isBlockedAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (normalized.includes(":"))
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("2001:db8")
    );
  const parts = normalized.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  )
    return true;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 198 && b >= 18 && b <= 19) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

async function resolvePublicHost(hostname: string) {
  const lower = hostname.toLowerCase();
  if (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  )
    throw new Error("Private and local destinations are blocked.");
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (
    !addresses.length ||
    addresses.some((entry) => isBlockedAddress(entry.address))
  )
    throw new Error("This hostname resolves to a private or reserved address.");
  return addresses[0];
}

async function safeRequest(
  input: string,
  method: "GET" | "HEAD" = "GET",
  redirects = 0,
): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  url: string;
  elapsed: number;
}> {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  if (url.username || url.password)
    throw new Error("URLs containing credentials are blocked.");
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port))
    throw new Error("Only standard public web ports are supported.");
  const resolved = await resolvePublicHost(url.hostname);
  const started = performance.now();
  const response = await new Promise<{
    status: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      url,
      {
        method,
        headers: {
          "user-agent": "Webutilia-NetworkUtility/1.0",
          accept:
            "text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5",
          "accept-encoding": "identity",
        },
        // Node enables auto-family selection for some requests and then asks custom
        // lookup functions for an address array. Returning the legacy single-address
        // shape in that case makes Node validate `undefined` as the IP address.
        lookup: (_hostname, options, callback) => {
          if (typeof options === "object" && options.all) {
            callback(null, [resolved]);
            return;
          }
          callback(null, resolved.address, resolved.family);
        },
      },
      (incoming) => {
        const chunks: Buffer[] = [];
        let size = 0;
        incoming.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000) {
            request.destroy(
              new Error("The response exceeded the 2 MB safety limit."),
            );
            return;
          }
          chunks.push(chunk);
        });
        incoming.on("end", () =>
          resolve({
            status: incoming.statusCode ?? 0,
            headers: incoming.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    request.setTimeout(8000, () =>
      request.destroy(new Error("The destination timed out.")),
    );
    request.on("error", reject);
    request.end();
  });
  if (
    response.status >= 300 &&
    response.status < 400 &&
    response.headers.location
  ) {
    if (redirects >= 3) throw new Error("Too many redirects.");
    return safeRequest(
      new URL(response.headers.location, url).toString(),
      method,
      redirects + 1,
    );
  }
  return {
    ...response,
    url: url.toString(),
    elapsed: Math.round(performance.now() - started),
  };
}

function parseDomain(value: string) {
  const trimmed = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/:\d+$/, "");
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
      trimmed,
    )
  )
    throw new Error("Enter a valid public domain name.");
  return trimmed;
}

async function portStatus(port: number, address: string) {
  return new Promise<{ port: number; open: boolean }>((resolve) => {
    const socket = net.createConnection({ host: address, port, timeout: 1400 });
    const finish = (open: boolean) => {
      socket.destroy();
      resolve({ port, open });
    };
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export async function POST(request: Request) {
  try {
    pruneRateBuckets();
    const { allowed, retryAfter } = checkRateLimit(getClientIp(request));
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const body = (await request.json()) as {
      action?: string;
      input?: string;
      authorized?: boolean;
    };
    const action = String(body.action ?? "");
    const input = String(body.input ?? "").trim();
    if (!input) throw new Error("Enter a URL or domain.");
    if (input.length > 2048) throw new Error("Keep the URL or domain under 2,048 characters.");
    if (!allowedActions.has(action)) throw new Error("Unknown network utility.");
    if (action === "html-content-scraper") {
      const page = await safeRequest(input);
      const contentType = String(page.headers["content-type"] ?? "").toLowerCase();
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        throw new Error("The destination did not return an HTML page.");
      }
      const report = extractReadableHtml(page.body);
      return NextResponse.json({
        url: page.url,
        status: page.status,
        contentType,
        bytes: Buffer.byteLength(page.body),
        ...report,
      });
    }
    if (action === "broken-link-checker") {
      const page = await safeRequest(input);
      const links = extractPageLinks(page.body, page.url, 30);
      const results = [];
      // Keep per-origin pressure low. Five parallel HEAD requests followed by five
      // GET fallbacks caused healthy Shopify collection pages to rate-limit the
      // checker with 429 responses.
      for (let index = 0; index < links.length; index += 2) {
        results.push(
          ...(await Promise.all(
            links.slice(index, index + 2).map(async (url) => {
              try {
                let response = await safeRequest(url, "HEAD");
                if (response.status >= 400 && response.status !== 429) {
                  response = await safeRequest(url, "GET");
                }
                const state = classifyLinkStatus(response.status);
                return {
                  url,
                  status: response.status,
                  ok: state === "working",
                  state,
                };
              } catch (error) {
                return {
                  url,
                  status: 0,
                  ok: false,
                  state: "unverified",
                  error:
                    error instanceof Error ? error.message : "Request failed",
                };
              }
            }),
          )),
        );
        if (index + 2 < links.length) {
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
      }
      return NextResponse.json({
        checked: results.length,
        broken: results.filter((item) => item.state === "broken").length,
        unverified: results.filter((item) => item.state === "unverified").length,
        results,
      });
    }
    if (action === "sitemap-builder") {
      const start = new URL(input);
      if (!["http:", "https:"].includes(start.protocol)) throw new Error("Only HTTP and HTTPS URLs are supported.");
      start.hash = "";
      const queue = [start.toString()];
      const attempted = new Set<string>();
      const successful = new Set<string>();
      let crawlOrigin = "";
      let failed = 0;
      // Stay comfortably under the 30s function limit even if pages are slow.
      const deadline = Date.now() + 22_000;
      while (queue.length && attempted.size < 25 && Date.now() < deadline) {
        // Fetch up to 4 pages per round so a few slow pages can't serialize
        // into a function timeout.
        const batch = queue.splice(0, 4).filter((url) => !attempted.has(url));
        batch.forEach((url) => attempted.add(url));
        const pages = await Promise.all(
          batch.map((url) => safeRequest(url).catch(() => null)),
        );
        for (const page of pages) {
          const contentType = String(
            page?.headers["content-type"] ?? "",
          ).toLowerCase();
          if (
            !page ||
            page.status < 200 ||
            page.status >= 400 ||
            (!contentType.includes("text/html") &&
              !contentType.includes("application/xhtml+xml"))
          ) {
            failed += 1;
            continue;
          }
          const resolvedPage = new URL(page.url);
          resolvedPage.hash = "";
          if (!crawlOrigin) crawlOrigin = resolvedPage.origin;
          if (resolvedPage.origin !== crawlOrigin) {
            failed += 1;
            continue;
          }
          successful.add(resolvedPage.toString());
          for (const link of extractPageLinks(page.body, page.url)) {
            try {
              const parsed = new URL(link);
              parsed.hash = "";
              const isLikelyAsset =
                /\.(?:avif|bmp|css|csv|docx?|eot|gif|ico|jpe?g|js|json|m4a|mov|mp3|mp4|ogg|otf|pdf|png|pptx?|rar|svg|tar|tiff?|ttf|wav|webm|webp|woff2?|xlsx?|xml|zip)$/i.test(
                  parsed.pathname,
                );
              if (
                parsed.origin === crawlOrigin &&
                !isLikelyAsset &&
                !attempted.has(parsed.toString()) &&
                !queue.includes(parsed.toString()) &&
                queue.length < 50
              )
                queue.push(parsed.toString());
            } catch {}
          }
        }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...successful].map((url) => `  <url><loc>${url.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</loc></url>`).join("\n")}\n</urlset>`;
      return NextResponse.json({
        pages: successful.size,
        attempted: attempted.size,
        failed,
        truncated: queue.length > 0 || Date.now() >= deadline,
        origin: crawlOrigin || start.origin,
        xml,
      });
    }
    if (action === "dns-inspector") {
      const domain = parseDomain(input);
      const settle = async <T>(promise: Promise<T>) =>
        promise.catch(() => [] as T);
      const [a, aaaa, mx, txt, cname, ns] = await Promise.all([
        settle(resolve4(domain)),
        settle(resolve6(domain)),
        settle(resolveMx(domain)),
        settle(resolveTxt(domain)),
        settle(resolveCname(domain)),
        settle(resolveNs(domain)),
      ]);
      return NextResponse.json({
        domain,
        A: a,
        AAAA: aaaa,
        MX: mx,
        TXT: txt,
        CNAME: cname,
        NS: ns,
      });
    }
    if (action === "port-scanner") {
      if (!body.authorized)
        throw new Error("Confirm that you are authorized to test this host.");
      const domain = parseDomain(input);
      const resolved = await resolvePublicHost(domain);
      const results = await Promise.all(
        allowedPorts.map((port) => portStatus(port, resolved.address)),
      );
      return NextResponse.json({
        host: domain,
        address: resolved.address,
        results,
      });
    }
    if (action === "ping-monitor") {
      const samples = [];
      for (let index = 0; index < 5; index += 1) {
        try {
          const response = await safeRequest(input, "HEAD");
          samples.push({
            attempt: index + 1,
            status: response.status,
            latencyMs: response.elapsed,
            ok: response.status > 0 && response.status < 500,
          });
        } catch (error) {
          samples.push({
            attempt: index + 1,
            status: 0,
            latencyMs: null,
            ok: false,
            error: error instanceof Error ? error.message : "Request failed",
          });
        }
      }
      const values = samples
        .map((sample) => sample.latencyMs)
        .filter((value): value is number => value !== null);
      return NextResponse.json({
        samples,
        averageMs: values.length
          ? Math.round(
              values.reduce((sum, value) => sum + value, 0) / values.length,
            )
          : null,
      });
    }
    if (action === "whois-lookup") {
      const domain = parseDomain(input);
      const response = await fetch(
        `https://rdap.org/domain/${encodeURIComponent(domain)}`,
        {
          headers: { accept: "application/rdap+json" },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok)
        throw new Error(`RDAP returned HTTP ${response.status}.`);
      const data = await response.json();
      return NextResponse.json(data);
    }
    throw new Error("Unknown network utility.");
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The request could not be completed.",
      },
      { status: 400 },
    );
  }
}
