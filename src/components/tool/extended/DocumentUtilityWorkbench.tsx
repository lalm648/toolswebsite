"use client";

import { useEffect, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";

type DocumentUtilityWorkbenchProps = { slug: string };
type BinaryResult = { url: string; name: string; size: number };

function downloadUrl(url: string, name: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
}

function sanitizeHtml(html: string) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode
    .querySelectorAll("script,style,iframe,object,embed,link,meta")
    .forEach((node) => node.remove());
  documentNode.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      if (
        /^on/i.test(attribute.name) ||
        ((attribute.name === "href" || attribute.name === "src") &&
          /^\s*javascript:/i.test(attribute.value))
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return documentNode.body.innerHTML;
}

function countText(text: string) {
  const trimmed = text.trim();
  return {
    words: trimmed ? (trimmed.match(/\S+/g)?.length ?? 0) : 0,
    characters: Array.from(text).length,
    sentences: trimmed
      ? (trimmed.match(/[^.!?]+(?:[.!?]+|$)/g)?.length ?? 0)
      : 0,
    paragraphs: trimmed
      ? trimmed.split(/\n\s*\n/).filter((value) => value.trim()).length
      : 0,
    lines: text ? text.split(/\r?\n/).length : 0,
  };
}

function wrapText(text: string, maxCharacters = 88) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      if (`${line} ${word}`.trim().length > maxCharacters && line) {
        lines.push(line);
        line = word;
      } else line = `${line} ${word}`.trim();
    }
    if (line) lines.push(line);
    lines.push("");
  }
  return lines;
}

export default function DocumentUtilityWorkbench({
  slug,
}: DocumentUtilityWorkbenchProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState(
    slug === "markdown-to-html"
      ? "# A clean Markdown preview\n\nWrite **Markdown** here and convert it into structured HTML.\n\n- Fast\n- Local\n- Copy-ready"
      : "",
  );
  const [output, setOutput] = useState("");
  const [result, setResult] = useState<BinaryResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  function setBinaryResult(bytes: Uint8Array, name: string, type: string) {
    if (result?.url) URL.revokeObjectURL(result.url);
    const blob = new Blob([new Uint8Array(bytes).buffer], { type });
    setResult({ url: URL.createObjectURL(blob), name, size: blob.size });
  }

  async function processFiles() {
    setBusy(true);
    setError("");
    setOutput("");
    try {
      if (slug === "pdf-merger") {
        const { PDFDocument } = await import("pdf-lib");
        const merged = await PDFDocument.create();
        for (const file of files) {
          const source = await PDFDocument.load(await file.arrayBuffer());
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach((page) => merged.addPage(page));
        }
        setBinaryResult(await merged.save(), "merged.pdf", "application/pdf");
      } else if (slug === "pdf-splitter") {
        const [{ PDFDocument }, JSZipModule] = await Promise.all([
          import("pdf-lib"),
          import("jszip"),
        ]);
        const source = await PDFDocument.load(await files[0].arrayBuffer());
        const zip = new JSZipModule.default();
        for (const pageIndex of source.getPageIndices()) {
          const document = await PDFDocument.create();
          const [page] = await document.copyPages(source, [pageIndex]);
          document.addPage(page);
          zip.file(
            `page-${String(pageIndex + 1).padStart(3, "0")}.pdf`,
            await document.save(),
          );
        }
        setBinaryResult(
          await zip.generateAsync({ type: "uint8array" }),
          "split-pages.zip",
          "application/zip",
        );
      } else if (slug === "image-to-pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const document = await PDFDocument.create();
        for (const file of files) {
          const bytes = await file.arrayBuffer();
          const embedded =
            file.type === "image/png"
              ? await document.embedPng(bytes)
              : await document.embedJpg(bytes);
          const scale = Math.min(
            1,
            1440 / embedded.width,
            1920 / embedded.height,
          );
          const width = embedded.width * scale;
          const height = embedded.height * scale;
          const page = document.addPage([width, height]);
          page.drawImage(embedded, { x: 0, y: 0, width, height });
        }
        setBinaryResult(await document.save(), "images.pdf", "application/pdf");
      } else if (slug === "pdf-text-extractor") {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();
        const document = await pdfjs.getDocument({
          data: new Uint8Array(await files[0].arrayBuffer()),
        }).promise;
        const pages: string[] = [];
        for (
          let pageNumber = 1;
          pageNumber <= document.numPages;
          pageNumber += 1
        ) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(
            `--- Page ${pageNumber} ---\n${content.items.map((item) => ("str" in item ? item.str : "")).join(" ")}`,
          );
        }
        setOutput(pages.join("\n\n"));
      } else if (slug === "file-word-counter") {
        const value = await files[0].text();
        const stats = countText(value);
        setText(value);
        setOutput(
          Object.entries(stats)
            .map(
              ([label, count]) =>
                `${label[0].toUpperCase()}${label.slice(1)}: ${count.toLocaleString()}`,
            )
            .join("\n"),
        );
      } else if (slug === "markdown-to-html") {
        const { marked } = await import("marked");
        setOutput(sanitizeHtml(await marked.parse(text, { async: true })));
      } else if (slug === "epub-to-pdf") {
        const [JSZipModule, pdfLib] = await Promise.all([
          import("jszip"),
          import("pdf-lib"),
        ]);
        const zip = await JSZipModule.default.loadAsync(
          await files[0].arrayBuffer(),
        );
        const container = await zip
          .file("META-INF/container.xml")
          ?.async("text");
        if (!container) throw new Error("This EPUB has no container manifest.");
        const rootPath = new DOMParser()
          .parseFromString(container, "application/xml")
          .querySelector("rootfile")
          ?.getAttribute("full-path");
        if (!rootPath)
          throw new Error("The EPUB package path could not be read.");
        const packageXml = await zip.file(rootPath)?.async("text");
        if (!packageXml)
          throw new Error("The EPUB package manifest is missing.");
        const packageNode = new DOMParser().parseFromString(
          packageXml,
          "application/xml",
        );
        const manifest = new Map(
          Array.from(packageNode.querySelectorAll("manifest item")).map(
            (item) => [item.getAttribute("id"), item.getAttribute("href")],
          ),
        );
        const base = rootPath.includes("/")
          ? rootPath.slice(0, rootPath.lastIndexOf("/") + 1)
          : "";
        const chapters: string[] = [];
        for (const item of Array.from(
          packageNode.querySelectorAll("spine itemref"),
        )) {
          const href = manifest.get(item.getAttribute("idref"));
          const html = href
            ? await zip.file(`${base}${href}`)?.async("text")
            : null;
          if (html)
            chapters.push(
              new DOMParser()
                .parseFromString(html, "text/html")
                .body.textContent?.replace(/\s+/g, " ")
                .trim() ?? "",
            );
        }
        const readableText = chapters.filter(Boolean).join("\n\n");
        if (!readableText)
          throw new Error("No readable chapter text was found.");
        const document = await pdfLib.PDFDocument.create();
        const font = await document.embedFont(pdfLib.StandardFonts.Helvetica);
        let page = document.addPage([612, 792]);
        let y = 744;
        for (const line of wrapText(readableText)) {
          if (y < 48) {
            page = document.addPage([612, 792]);
            y = 744;
          }
          page.drawText(line, {
            x: 48,
            y,
            size: 10.5,
            font,
            color: pdfLib.rgb(0.08, 0.1, 0.15),
          });
          y -= line ? 15 : 9;
        }
        setBinaryResult(await document.save(), "ebook.pdf", "application/pdf");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The document could not be processed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const accept =
    slug === "image-to-pdf"
      ? "image/jpeg,image/png"
      : slug === "file-word-counter"
        ? ".txt,.md,text/plain,text/markdown"
        : slug === "epub-to-pdf"
          ? ".epub,application/epub+zip"
          : "application/pdf,.pdf";
  const multiple = slug === "pdf-merger" || slug === "image-to-pdf";
  const fileRequired = slug !== "markdown-to-html";

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[1.35rem] border border-[var(--outline-soft)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">Source</h2>
        {slug === "markdown-to-html" ? (
          <Textarea
            className="mt-4 min-h-80 font-mono text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        ) : (
          <>
            <Input
              className="mt-4"
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []).slice(0, 50))
              }
            />
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              {files.length
                ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                : multiple
                  ? "Choose files in the order they should be processed."
                  : "Choose one supported document."}
            </p>
          </>
        )}
        <Button
          className="mt-5 w-full sm:w-auto"
          disabled={busy || (fileRequired ? !files.length : !text.trim())}
          onClick={() => void processFiles()}
        >
          {busy ? "Processing locally…" : "Process document"}
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
            {output ? <CopyButton value={output} /> : null}
            {output ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadTextFile(
                    output,
                    slug === "markdown-to-html"
                      ? "document.html"
                      : "extracted.txt",
                    slug === "markdown-to-html" ? "text/html" : "text/plain",
                  )
                }
              >
                Download
              </Button>
            ) : null}
            {result ? (
              <Button
                size="sm"
                onClick={() => downloadUrl(result.url, result.name)}
              >
                Download file
              </Button>
            ) : null}
          </div>
        </div>
        {slug === "markdown-to-html" && output ? (
          <iframe
            title="Rendered Markdown"
            sandbox=""
            srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font:16px/1.65 system-ui;padding:24px;color:#0f172a}pre,code{background:#f1f5f9;border-radius:6px}pre{padding:12px;overflow:auto}blockquote{border-left:3px solid #2563eb;margin-left:0;padding-left:16px;color:#475569}</style>${output}`}
            className="mt-4 min-h-96 w-full rounded-xl border border-[var(--outline-soft)] bg-white"
          />
        ) : output ? (
          <pre className="mt-4 min-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-7">
            {output}
          </pre>
        ) : result ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="font-semibold">{result.name} is ready</p>
            <p className="mt-1 text-sm">
              {(result.size / 1024).toFixed(1)} KB · processed locally
            </p>
          </div>
        ) : (
          <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-[var(--outline-strong)] text-sm text-[var(--muted-foreground)]">
            Your document output will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
