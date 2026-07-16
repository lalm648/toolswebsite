"use client";

import { useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadTextFile } from "@/lib/download";

export default function NetworkUtilityWorkbench({ slug }: { slug: string }) {
  const domainOnly = new Set(["dns-inspector", "port-scanner", "whois-lookup"]);
  const [input, setInput] = useState(
    domainOnly.has(slug) ? "example.com" : "https://example.com",
  );
  const [authorized, setAuthorized] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const response = await fetch("/api/network-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: slug, input, authorized }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "The network request failed.");
      setOutput(
        slug === "html-content-scraper"
          ? data.content
          : slug === "sitemap-builder"
            ? data.xml
            : JSON.stringify(data, null, 2),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The network request failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">
          Public destination
        </h2>
        <label className="mt-4 block text-sm font-medium">
          {domainOnly.has(slug) ? "Domain name" : "HTTP or HTTPS URL"}
          <Input
            className="mt-2"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
        {slug === "port-scanner" ? (
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <input
              className="mt-1"
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
        <Button
          className="mt-5 w-full"
          disabled={
            busy || !input.trim() || (slug === "port-scanner" && !authorized)
          }
          onClick={() => void run()}
        >
          {busy ? "Running controlled checks…" : "Run diagnostic"}
        </Button>
        <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
          Private, loopback, link-local, and reserved IP ranges are blocked.
          Crawls and responses use strict page, size, redirect, and timeout
          limits.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Result
          </h2>
          <div className="flex gap-2">
            <CopyButton value={output} />
            {output ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadTextFile(
                    output,
                    slug === "sitemap-builder" ? "sitemap.xml" : `${slug}.txt`,
                    slug === "sitemap-builder"
                      ? "application/xml"
                      : "text/plain",
                  )
                }
              >
                Download
              </Button>
            ) : null}
          </div>
        </div>
        <pre className="mt-4 min-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-6">
          {output || "Controlled diagnostic output will appear here."}
        </pre>
      </section>
    </div>
  );
}
