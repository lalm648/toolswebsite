"use client";

/* eslint-disable @next/next/no-img-element -- Generated data URLs are local previews, not network images. */

import { useEffect, useRef, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";

type GeneratorUtilityWorkbenchProps = { slug: string };
type ShortLink = { code: string; url: string; createdAt: string };

const SHORT_LINK_STORAGE_KEY = "toolswebsite-short-links";

function secureRandomIndex(max: number) {
  const limit = Math.floor(256 / max) * max;
  const bytes = new Uint8Array(1);
  do crypto.getRandomValues(bytes);
  while (bytes[0] >= limit);
  return bytes[0] % max;
}

function generatePassword(
  length: number,
  options: {
    lower: boolean;
    upper: boolean;
    digits: boolean;
    symbols: boolean;
  },
) {
  const groups = [
    options.lower ? "abcdefghijkmnopqrstuvwxyz" : "",
    options.upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "",
    options.digits ? "23456789" : "",
    options.symbols ? "!@#$%^&*()-_=+[]{}" : "",
  ].filter(Boolean);
  if (!groups.length) throw new Error("Select at least one character group.");
  if (length < groups.length)
    throw new Error(
      `Use at least ${groups.length} characters for the selected rules.`,
    );
  const characters = groups.map(
    (group) => group[secureRandomIndex(group.length)],
  );
  const pool = groups.join("");
  while (characters.length < length)
    characters.push(pool[secureRandomIndex(pool.length)]);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = secureRandomIndex(index + 1);
    [characters[index], characters[target]] = [
      characters[target],
      characters[index],
    ];
  }
  return characters.join("");
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export default function GeneratorUtilityWorkbench({
  slug,
}: GeneratorUtilityWorkbenchProps) {
  const [input, setInput] = useState(
    slug === "qr-code-generator"
      ? "https://example.com"
      : slug === "barcode-generator"
        ? "123456789012"
        : "",
  );
  const [output, setOutput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [length, setLength] = useState(20);
  const [count, setCount] = useState(5);
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [file, setFile] = useState<File | null>(null);
  const [rules, setRules] = useState({
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
  });
  const [links, setLinks] = useState<ShortLink[]>([]);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (slug !== "url-shortener") return;
    try {
      setLinks(
        JSON.parse(localStorage.getItem(SHORT_LINK_STORAGE_KEY) ?? "[]"),
      );
    } catch {
      setLinks([]);
    }
  }, [slug]);

  async function generate() {
    setError("");
    setImageUrl("");
    try {
      if (slug === "password-generator") {
        setOutput(
          Array.from({ length: count }, () =>
            generatePassword(length, rules),
          ).join("\n"),
        );
      } else if (slug === "uuid-generator") {
        setOutput(
          Array.from({ length: Math.min(100, count) }, () =>
            crypto.randomUUID(),
          ).join("\n"),
        );
      } else if (slug === "hash-calculator") {
        const data = file
          ? await file.arrayBuffer()
          : new TextEncoder().encode(input).buffer;
        setOutput(bytesToHex(await crypto.subtle.digest(algorithm, data)));
      } else if (slug === "qr-code-generator") {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(input, {
          width: 768,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setImageUrl(url);
        setOutput(input);
      } else if (slug === "barcode-generator") {
        const JsBarcode = (await import("jsbarcode")).default;
        if (!barcodeRef.current) return;
        JsBarcode(barcodeRef.current, input, {
          format: "CODE128",
          displayValue: true,
          background: "#ffffff",
          lineColor: "#0f172a",
          margin: 24,
          width: 3,
          height: 120,
        });
        const svg = new XMLSerializer().serializeToString(barcodeRef.current);
        setImageUrl(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        );
        setOutput(input);
      } else if (slug === "url-shortener") {
        const url = new URL(input);
        if (!/^https?:$/.test(url.protocol))
          throw new Error("Use an HTTP or HTTPS URL.");
        const code = Array.from(
          { length: 7 },
          () => "abcdefghijkmnopqrstuvwxyz23456789"[secureRandomIndex(32)],
        ).join("");
        const next = [
          { code, url: url.toString(), createdAt: new Date().toISOString() },
          ...links,
        ].slice(0, 100);
        localStorage.setItem(SHORT_LINK_STORAGE_KEY, JSON.stringify(next));
        setLinks(next);
        setOutput(`${location.origin}/s/${code}`);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The value could not be generated.",
      );
    }
  }

  const title =
    slug === "password-generator"
      ? "Password settings"
      : slug === "uuid-generator"
        ? "UUID batch"
        : slug === "hash-calculator"
          ? "Hash source"
          : slug === "url-shortener"
            ? "Long URL"
            : "Content to encode";

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">{title}</h2>
        {slug === "password-generator" ? (
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">
              Length: {length}
              <input
                className="mt-2 w-full accent-[var(--accent-500)]"
                type="range"
                min="8"
                max="128"
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
              />
            </label>
            <label className="block text-sm font-medium">
              Passwords
              <Input
                type="number"
                min="1"
                max="100"
                className="mt-2"
                value={count}
                onChange={(event) =>
                  setCount(
                    Math.max(1, Math.min(100, Number(event.target.value))),
                  )
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["lower", "Lowercase"],
                  ["upper", "Uppercase"],
                  ["digits", "Digits"],
                  ["symbols", "Symbols"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-[var(--outline-soft)] p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={rules[key]}
                    onChange={(event) =>
                      setRules((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : slug === "uuid-generator" ? (
          <label className="mt-4 block text-sm font-medium">
            How many
            <Input
              type="number"
              min="1"
              max="100"
              className="mt-2"
              value={count}
              onChange={(event) =>
                setCount(Math.max(1, Math.min(100, Number(event.target.value))))
              }
            />
          </label>
        ) : slug === "hash-calculator" ? (
          <div className="mt-4 space-y-3">
            <select
              className="h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value)}
            >
              {["SHA-1", "SHA-256", "SHA-384", "SHA-512"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter text, or choose a file below"
            />
            <Input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <Textarea
            className="mt-4 min-h-40"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              slug === "url-shortener"
                ? "https://example.com/very/long/link"
                : "Enter text or a URL"
            }
          />
        )}
        <Button
          className="mt-4 w-full"
          onClick={() => void generate()}
          disabled={
            slug !== "password-generator" &&
            slug !== "uuid-generator" &&
            !input.trim() &&
            !file
          }
        >
          Generate
        </Button>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Result
          </h2>
          <div className="flex gap-2">
            <CopyButton value={output} />
            {imageUrl ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const anchor = document.createElement("a");
                  anchor.href = imageUrl;
                  anchor.download =
                    slug === "barcode-generator"
                      ? "barcode.svg"
                      : "qr-code.png";
                  anchor.click();
                }}
              >
                Download image
              </Button>
            ) : output ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadTextFile(output, `${slug}.txt`)}
              >
                Download
              </Button>
            ) : null}
          </div>
        </div>
        {imageUrl ? (
          <div className="mt-5 flex min-h-72 items-center justify-center rounded-xl border border-[var(--outline-soft)] bg-white p-5">
            <img
              src={imageUrl}
              alt="Generated code"
              className="max-h-80 max-w-full"
            />
          </div>
        ) : (
          <pre className="mt-4 min-h-56 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-7">
            {output || "Your generated result will appear here."}
          </pre>
        )}
        <svg ref={barcodeRef} className="hidden" aria-hidden="true" />
        {slug === "url-shortener" && links.length ? (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-semibold text-[var(--ink-900)]">
              Local registry
            </p>
            {links.slice(0, 8).map((link) => (
              <div
                key={link.code}
                className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 text-xs"
              >
                <p className="font-semibold text-[var(--accent-700)]">
                  /s/{link.code}
                </p>
                <p className="mt-1 truncate text-[var(--muted-foreground)]">
                  {link.url}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
