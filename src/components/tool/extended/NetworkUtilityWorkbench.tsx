"use client";

import { useRef, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import {
  PrivacyNotice,
  ProcessingProgress,
  WorkbenchError,
} from "@/components/tool/WorkbenchStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadTextFile } from "@/lib/download";

type NetworkResult = Record<string, unknown>;
type ResultView = "overview" | "raw";
type BrokenLinkResult = {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
};
type PortResult = { port: number; open: boolean };
type PingSample = {
  attempt: number;
  status: number;
  latencyMs: number | null;
  ok: boolean;
  error?: string;
};
type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapNameserver = { ldhName?: string; unicodeName?: string };

const domainOnly = new Set(["dns-inspector", "port-scanner", "whois-lookup"]);

const toolLabels: Record<
  string,
  { title: string; action: string; result: string }
> = {
  "html-content-scraper": {
    title: "Page to extract",
    action: "Extract readable content",
    result: "Content report",
  },
  "broken-link-checker": {
    title: "Page to inspect",
    action: "Check page links",
    result: "Link health report",
  },
  "sitemap-builder": {
    title: "Site starting URL",
    action: "Discover site pages",
    result: "Sitemap report",
  },
  "dns-inspector": {
    title: "Domain to inspect",
    action: "Inspect DNS records",
    result: "DNS report",
  },
  "port-scanner": {
    title: "Authorized public host",
    action: "Check common ports",
    result: "Port report",
  },
  "ping-monitor": {
    title: "URL to measure",
    action: "Measure five samples",
    result: "Latency report",
  },
  "whois-lookup": {
    title: "Domain to look up",
    action: "Look up RDAP record",
    result: "Registration report",
  },
};

function displayValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(displayValue).join(" · ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("exchange" in record) {
      return `${displayValue(record.exchange)}${
        "priority" in record ? ` · priority ${displayValue(record.priority)}` : ""
      }`;
    }
    return JSON.stringify(value);
  }
  return "—";
}

function SummaryMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warning";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"
        : "border-[var(--outline-soft)] bg-[var(--surface-raised)] text-[var(--ink-900)]";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70">
        {label}
      </dt>
      <dd className="mt-1 break-words text-lg font-bold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function EmptyOverview() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-[var(--outline-strong)] px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-100)] text-xl text-[var(--accent-700)]">
          ↗
        </div>
        <p className="mt-4 font-semibold text-[var(--ink-900)]">
          Ready for a controlled diagnostic
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
          Run the check to see a visual summary. The complete machine-readable
          response remains available in the Raw data view.
        </p>
      </div>
    </div>
  );
}

function ResultOverview({
  slug,
  result,
}: {
  slug: string;
  result: NetworkResult | null;
}) {
  if (!result) return <EmptyOverview />;

  if (slug === "ping-monitor") {
    const samples = (Array.isArray(result.samples)
      ? result.samples
      : []) as PingSample[];
    const values = samples
      .map((sample) => sample.latencyMs)
      .filter((value): value is number => typeof value === "number");
    const average =
      typeof result.averageMs === "number" ? result.averageMs : null;
    const max = Math.max(...values, 1);
    const availability = samples.length
      ? Math.round(
          (samples.filter((sample) => sample.ok).length / samples.length) * 100,
        )
      : 0;
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric
            label="Average"
            value={average === null ? "—" : `${average} ms`}
          />
          <SummaryMetric
            label="Fastest"
            value={values.length ? `${Math.min(...values)} ms` : "—"}
            tone="good"
          />
          <SummaryMetric
            label="Slowest"
            value={values.length ? `${Math.max(...values)} ms` : "—"}
            tone={values.length && Math.max(...values) > 800 ? "warning" : "default"}
          />
          <SummaryMetric
            label="Availability"
            value={`${availability}%`}
            tone={availability === 100 ? "good" : "warning"}
          />
        </dl>
        <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--ink-900)]">
              Response-time samples
            </p>
            <span className="text-xs text-[var(--muted-foreground)]">
              Lower is faster
            </span>
          </div>
          <div className="mt-5 grid h-48 grid-cols-5 items-end gap-3 border-b border-[var(--outline-soft)] px-2">
            {samples.map((sample) => {
              const height =
                sample.latencyMs === null
                  ? 8
                  : Math.max(12, (sample.latencyMs / max) * 100);
              return (
                <div
                  key={sample.attempt}
                  className="flex h-full min-w-0 flex-col justify-end text-center"
                  title={
                    sample.latencyMs === null
                      ? sample.error ?? "Request failed"
                      : `${sample.latencyMs} ms · HTTP ${sample.status}`
                  }
                >
                  <span className="mb-2 truncate text-[11px] font-semibold tabular-nums text-[var(--ink-900)]">
                    {sample.latencyMs === null ? "Failed" : `${sample.latencyMs} ms`}
                  </span>
                  <span
                    className={`mx-auto block w-full max-w-12 rounded-t-lg ${
                      sample.ok ? "bg-[var(--accent-500)]" : "bg-red-500"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {sample.attempt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (slug === "port-scanner") {
    const results = (Array.isArray(result.results)
      ? result.results
      : []) as PortResult[];
    const open = results.filter((item) => item.open);
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryMetric label="Host" value={displayValue(result.host)} />
          <SummaryMetric label="Resolved IP" value={displayValue(result.address)} />
          <SummaryMetric
            label="Open ports"
            value={`${open.length} / ${results.length}`}
            tone={open.length ? "warning" : "good"}
          />
        </dl>
        <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
          <p className="text-sm font-semibold text-[var(--ink-900)]">
            Common port status
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {results.map((item) => (
              <li
                key={item.port}
                className={`rounded-xl border px-2 py-3 text-center ${
                  item.open
                    ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"
                }`}
              >
                <span className="block text-sm font-bold tabular-nums">
                  {item.port}
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide opacity-70">
                  {item.open ? "Open" : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (slug === "broken-link-checker") {
    const results = (Array.isArray(result.results)
      ? result.results
      : []) as BrokenLinkResult[];
    const broken = typeof result.broken === "number" ? result.broken : 0;
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <SummaryMetric label="Links checked" value={String(results.length)} />
          <SummaryMetric
            label="Broken"
            value={String(broken)}
            tone={broken ? "warning" : "good"}
          />
        </dl>
        <div className="max-h-96 overflow-auto rounded-xl border border-[var(--outline-soft)]">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[var(--surface-panel)] text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Destination</th>
                <th className="px-4 py-3 font-semibold">HTTP</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr
                  key={item.url}
                  className="border-t border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 font-bold ${
                        item.ok
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                      }`}
                    >
                      {item.ok ? "Working" : "Broken"}
                    </span>
                  </td>
                  <td className="max-w-md break-all px-4 py-3 text-[var(--ink-900)]">
                    {item.url}
                    {item.error ? (
                      <span className="mt-1 block text-red-600 dark:text-red-300">
                        {item.error}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {item.status || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (slug === "dns-inspector") {
    const recordTypes = ["A", "AAAA", "MX", "TXT", "CNAME", "NS"];
    const total = recordTypes.reduce(
      (sum, type) => sum + (Array.isArray(result[type]) ? result[type].length : 0),
      0,
    );
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <SummaryMetric label="Domain" value={displayValue(result.domain)} />
          <SummaryMetric label="Records found" value={String(total)} tone="good" />
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          {recordTypes.map((type) => {
            const values = Array.isArray(result[type]) ? result[type] : [];
            return (
              <section
                key={type}
                className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[var(--ink-900)]">{type}</h3>
                  <span className="rounded-full bg-[var(--accent-100)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-700)]">
                    {values.length}
                  </span>
                </div>
                {values.length ? (
                  <ul className="mt-3 space-y-2">
                    {values.map((value, index) => (
                      <li
                        key={`${type}-${index}`}
                        className="break-all rounded-lg bg-[var(--surface-panel)] px-3 py-2 font-mono text-xs leading-5"
                      >
                        {displayValue(value)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    No published record returned.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (slug === "sitemap-builder") {
    const xml = typeof result.xml === "string" ? result.xml : "";
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
      match[1].replace(/&amp;/g, "&"),
    );
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric
            label="Valid pages"
            value={displayValue(result.pages)}
            tone="good"
          />
          <SummaryMetric
            label="URLs attempted"
            value={displayValue(result.attempted ?? result.pages)}
          />
          <SummaryMetric
            label="Failed / skipped"
            value={displayValue(result.failed ?? 0)}
            tone={Number(result.failed ?? 0) ? "warning" : "good"}
          />
          <SummaryMetric label="Format" value="XML sitemap" />
        </dl>
        {result.truncated ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            This safety-limited crawl stopped with URLs still queued. The XML
            contains only successfully fetched HTML pages from the final site
            origin, not every URL on a large website.
          </p>
        ) : null}
        <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
          <p className="text-sm font-semibold text-[var(--ink-900)]">
            Discovered URLs
          </p>
          <ol className="mt-3 max-h-80 space-y-2 overflow-auto">
            {urls.map((url, index) => (
              <li
                key={url}
                className="flex gap-3 rounded-lg bg-[var(--surface-panel)] px-3 py-2 text-xs"
              >
                <span className="shrink-0 font-bold tabular-nums text-[var(--accent-700)]">
                  {index + 1}
                </span>
                <span className="break-all text-[var(--ink-900)]">{url}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  if (slug === "html-content-scraper") {
    const content = typeof result.content === "string" ? result.content : "";
    const title = typeof result.title === "string" ? result.title : "";
    const description =
      typeof result.description === "string" ? result.description : "";
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryMetric label="HTTP status" value={displayValue(result.status)} />
          <SummaryMetric
            label="Words extracted"
            value={displayValue(result.words ?? 0)}
            tone="good"
          />
          <SummaryMetric label="Headings" value={displayValue(result.headings ?? 0)} />
          <SummaryMetric label="Paragraphs" value={displayValue(result.paragraphs ?? 0)} />
        </dl>
        <div className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-5">
          <p className="break-all text-xs font-semibold text-[var(--accent-700)]">
            {displayValue(result.url)}
          </p>
          {title ? (
            <h3 className="mt-3 text-xl font-semibold text-[var(--ink-900)]">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {result.language ? (
              <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1">
                Language {displayValue(result.language)}
              </span>
            ) : null}
            {result.bytes ? (
              <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1">
                {Number(result.bytes).toLocaleString()} source bytes
              </span>
            ) : null}
            {result.canonical ? (
              <span className="max-w-full truncate rounded-full bg-[var(--surface-panel)] px-2.5 py-1 normal-case tracking-normal">
                Canonical {displayValue(result.canonical)}
              </span>
            ) : null}
          </div>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--ink-900)]">
            {content || "No readable heading or paragraph content was found."}
          </pre>
        </div>
      </div>
    );
  }

  if (slug === "whois-lookup") {
    const statuses = Array.isArray(result.status) ? result.status : [];
    const events = (Array.isArray(result.events) ? result.events : []) as RdapEvent[];
    const nameservers = (Array.isArray(result.nameservers)
      ? result.nameservers
      : []) as RdapNameserver[];
    return (
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryMetric
            label="Domain"
            value={displayValue(result.ldhName ?? result.unicodeName)}
          />
          <SummaryMetric
            label="Status entries"
            value={String(statuses.length)}
            tone="good"
          />
          <SummaryMetric label="Nameservers" value={String(nameservers.length)} />
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
            <h3 className="text-sm font-semibold text-[var(--ink-900)]">
              Registration timeline
            </h3>
            <dl className="mt-3 space-y-3">
              {events.map((event, index) => (
                <div
                  key={`${event.eventAction}-${index}`}
                  className="rounded-lg bg-[var(--surface-panel)] px-3 py-2"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {event.eventAction ?? "Event"}
                  </dt>
                  <dd className="mt-1 text-xs font-semibold tabular-nums text-[var(--ink-900)]">
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleString()
                      : "Date unavailable"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
            <h3 className="text-sm font-semibold text-[var(--ink-900)]">
              Status and nameservers
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {statuses.map((status, index) => (
                <span
                  key={`${displayValue(status)}-${index}`}
                  className="rounded-full bg-[var(--accent-100)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-700)]"
                >
                  {displayValue(status)}
                </span>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {nameservers.map((nameserver, index) => (
                <li
                  key={`${nameserver.ldhName}-${index}`}
                  className="break-all rounded-lg bg-[var(--surface-panel)] px-3 py-2 font-mono text-xs"
                >
                  {nameserver.ldhName ?? nameserver.unicodeName ?? "Unknown"}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return <EmptyOverview />;
}

export default function NetworkUtilityWorkbench({ slug }: { slug: string }) {
  const [input, setInput] = useState(
    domainOnly.has(slug) ? "example.com" : "https://example.com",
  );
  const [authorized, setAuthorized] = useState(false);
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [view, setView] = useState<ResultView>("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const labels = toolLabels[slug] ?? {
    title: "Public destination",
    action: "Run diagnostic",
    result: "Diagnostic report",
  };
  const rawOutput = result ? JSON.stringify(result, null, 2) : "";

  async function run() {
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");
    setOutput("");
    setResult(null);
    setView("overview");
    try {
      const response = await fetch("/api/network-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: slug, input, authorized }),
        signal: controller.signal,
      });
      const data = (await response.json()) as NetworkResult & { error?: string };
      if (!response.ok)
        throw new Error(data.error ?? "The network request failed.");
      setResult(data);
      setOutput(
        slug === "html-content-scraper"
          ? String(data.content ?? "")
          : slug === "sitemap-builder"
            ? String(data.xml ?? "")
            : JSON.stringify(data, null, 2),
      );
    } catch (caught) {
      setError(
        caught instanceof DOMException && caught.name === "AbortError"
          ? "Diagnostic canceled."
          : caught instanceof Error
            ? caught.message
            : "The network request failed.",
      );
    } finally {
      requestRef.current = null;
      setBusy(false);
    }
  }

  function cancelRequest() {
    requestRef.current?.abort();
  }

  function resetWorkbench() {
    cancelRequest();
    setOutput("");
    setResult(null);
    setError("");
    setAuthorized(false);
    setView("overview");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
      <section className="rounded-[1.35rem] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">
              Controlled public check
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--ink-900)]">
              {labels.title}
            </h2>
          </div>
          <span className="rounded-full bg-[var(--surface-panel)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
            Safe limits
          </span>
        </div>
        <label className="mt-4 block text-sm font-medium">
          {domainOnly.has(slug) ? "Domain name" : "HTTP or HTTPS URL"}
          <Input
            className="mt-2 font-mono text-sm"
            value={input}
            maxLength={2048}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        {slug === "port-scanner" ? (
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            <input
              className="mt-1 accent-amber-600"
              type="checkbox"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
            />
            <span>
              I own this public host or have explicit authorization to test its
              common ports.
            </span>
          </label>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:flex-1"
            disabled={
              busy ||
              !input.trim() ||
              (slug === "port-scanner" && !authorized)
            }
            onClick={() => void run()}
          >
            {labels.action}
          </Button>
          {output || error ? (
            <Button type="button" variant="secondary" onClick={resetWorkbench}>
              Reset
            </Button>
          ) : null}
        </div>
        <ProcessingProgress
          active={busy}
          label="Running controlled checks"
          onCancel={cancelRequest}
        />
        <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          Private, loopback, link-local, and reserved IP ranges are blocked.
          Crawls and responses use strict page, size, redirect, and timeout
          limits.
        </p>
        <PrivacyNotice serverRequired />
        <WorkbenchError message={error} />
      </section>

      <section className="min-w-0 rounded-[1.35rem] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">
              Visual diagnostic
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--ink-900)]">
              {labels.result}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-1"
              role="tablist"
              aria-label="Result view"
            >
              {(["overview", "raw"] as ResultView[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={view === item}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    view === item
                      ? "bg-[var(--surface-cta)] text-white shadow-sm"
                      : "text-[var(--muted-foreground)] hover:text-[var(--ink-900)]"
                  }`}
                  onClick={() => setView(item)}
                >
                  {item === "raw" ? "Raw data" : item}
                </button>
              ))}
            </div>
            <CopyButton value={view === "raw" ? rawOutput : output} />
            {output ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadTextFile(
                    output,
                    slug === "sitemap-builder"
                      ? "sitemap.xml"
                      : `${slug}.${slug === "html-content-scraper" ? "txt" : "json"}`,
                    slug === "sitemap-builder"
                      ? "application/xml"
                      : slug === "html-content-scraper"
                        ? "text/plain"
                        : "application/json",
                  )
                }
              >
                Download
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4" role="tabpanel">
          {view === "overview" ? (
            <ResultOverview slug={slug} result={result} />
          ) : (
            <pre
              aria-live="polite"
              className="min-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-xs leading-6"
            >
              {rawOutput || "The complete diagnostic response will appear here."}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
