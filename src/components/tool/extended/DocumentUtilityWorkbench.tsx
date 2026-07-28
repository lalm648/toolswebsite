"use client";

/* eslint-disable @next/next/no-img-element -- PDF thumbnails are generated as local data URLs. */

import { useEffect, useState } from "react";
import CopyButton from "@/components/tool/CopyButton";
import FileDropzone from "@/components/tool/FileDropzone";
import { PrivacyNotice, ProcessingProgress, WorkbenchError } from "@/components/tool/WorkbenchStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/download";
import {
  extractPdfPageText,
  type PdfTextMode,
} from "@/lib/tools/pdf-text";

type DocumentUtilityWorkbenchProps = { slug: string };
type BinaryResult = { url: string; name: string; size: number; type: string; pageCount?: number };
type PdfPageInfo = { counts: number[]; thumbnails: string[] };
type PdfExtractionStats = {
  pages: number;
  textItems: number;
  words: number;
  characters: number;
};

function documentSizeChange(original: number, output: number) {
  if (!original || !output) return "";
  const change = ((original - output) / original) * 100;
  return change >= 0
    ? `${change.toFixed(1)}% smaller`
    : `${Math.abs(change).toFixed(1)}% larger`;
}

function formatDocumentBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

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

function parsePageSelection(value: string, totalPages: number) {
  if (!value.trim()) return Array.from({ length: totalPages }, (_, index) => index);
  const selected = new Set<number>();
  for (const token of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = token.match(/^\d+$/);
    if (!range && !single) throw new Error(`“${token}” is not a valid page or page range.`);
    const start = Number(range?.[1] ?? token);
    const end = Number(range?.[2] ?? token);
    if (start < 1 || end < start || end > totalPages) {
      throw new Error(`Page range ${token} is outside this ${totalPages}-page document.`);
    }
    for (let page = start; page <= end; page += 1) selected.add(page - 1);
  }
  if (!selected.size) throw new Error("Choose at least one page.");
  return [...selected].sort((a, b) => a - b);
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
  const [progress, setProgress] = useState(0);
  const [pageSelection, setPageSelection] = useState("");
  const [pdfInfo, setPdfInfo] = useState<PdfPageInfo>({ counts: [], thumbnails: [] });
  const [pdfTextMode, setPdfTextMode] =
    useState<PdfTextMode>("reading-order");
  const [joinHyphenated, setJoinHyphenated] = useState(true);
  const [includePageHeaders, setIncludePageHeaders] = useState(true);
  const [extractionStats, setExtractionStats] =
    useState<PdfExtractionStats | null>(null);

  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  function setBinaryResult(bytes: Uint8Array, name: string, type: string, pageCount?: number) {
    if (result?.url) URL.revokeObjectURL(result.url);
    const blob = new Blob([new Uint8Array(bytes).buffer], { type });
    setResult({ url: URL.createObjectURL(blob), name, size: blob.size, type, pageCount });
  }

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  async function inspectDocuments(next: File[]) {
    setPdfInfo({ counts: [], thumbnails: [] });
    if (!next.length || !next.every((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const counts = await Promise.all(next.map(async (file) => {
        const document = await PDFDocument.load(await file.arrayBuffer());
        return document.getPageCount();
      }));
      const thumbnails: string[] = [];
      if (["pdf-splitter", "pdf-merger"].includes(slug)) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
        const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(await next[0].arrayBuffer()) }).promise;
        for (let pageNumber = 1; pageNumber <= Math.min(12, pdfDocument.numPages); pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 0.28 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) break;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          thumbnails.push(canvas.toDataURL("image/jpeg", 0.72));
        }
      }
      setPdfInfo({ counts, thumbnails });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "PDF details could not be read.");
    }
  }

  async function processFiles() {
    setBusy(true);
    setError("");
    setOutput("");
    setProgress(0);
    setExtractionStats(null);
    clearResult();
    try {
      if (slug === "pdf-merger") {
        const { PDFDocument } = await import("pdf-lib");
        const merged = await PDFDocument.create();
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const source = await PDFDocument.load(await file.arrayBuffer());
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach((page) => merged.addPage(page));
          setProgress((index + 1) / files.length);
        }
        const bytes = await merged.save();
        await PDFDocument.load(bytes);
        setBinaryResult(bytes, "merged.pdf", "application/pdf", merged.getPageCount());
      } else if (slug === "pdf-splitter") {
        const [{ PDFDocument }, JSZipModule] = await Promise.all([
          import("pdf-lib"),
          import("jszip"),
        ]);
        const source = await PDFDocument.load(await files[0].arrayBuffer());
        const zip = new JSZipModule.default();
        const pageIndices = parsePageSelection(pageSelection, source.getPageCount());
        for (let selectionIndex = 0; selectionIndex < pageIndices.length; selectionIndex += 1) {
          const pageIndex = pageIndices[selectionIndex];
          const document = await PDFDocument.create();
          const [page] = await document.copyPages(source, [pageIndex]);
          document.addPage(page);
          zip.file(
            `page-${String(pageIndex + 1).padStart(3, "0")}.pdf`,
            await document.save(),
          );
          setProgress((selectionIndex + 1) / pageIndices.length);
        }
        setBinaryResult(
          await zip.generateAsync({ type: "uint8array" }),
          "split-pages.zip",
          "application/zip",
          pageIndices.length,
        );
      } else if (slug === "image-to-pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const document = await PDFDocument.create();
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
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
          setProgress((index + 1) / files.length);
        }
        const bytes = await document.save();
        await PDFDocument.load(bytes);
        setBinaryResult(bytes, "images.pdf", "application/pdf", document.getPageCount());
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
        let textItems = 0;
        let words = 0;
        let characters = 0;
        for (
          let pageNumber = 1;
          pageNumber <= document.numPages;
          pageNumber += 1
        ) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          const extracted = extractPdfPageText(
            content.items.filter(
              (item): item is import("pdfjs-dist/types/src/display/api").TextItem =>
                "str" in item,
            ),
            { mode: pdfTextMode, joinHyphenated },
          );
          textItems += extracted.items;
          words += extracted.words;
          characters += extracted.characters;
          if (extracted.text) {
            pages.push(
              includePageHeaders
                ? `--- Page ${pageNumber} ---\n${extracted.text}`
                : extracted.text,
            );
          }
          setProgress(pageNumber / document.numPages);
        }
        if (!pages.length) {
          throw new Error(
            "No embedded text was found. This PDF may contain scanned images and needs OCR, which this extractor does not claim to perform.",
          );
        }
        setExtractionStats({
          pages: document.numPages,
          textItems,
          words,
          characters,
        });
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
        const bytes = await document.save();
        await pdfLib.PDFDocument.load(bytes);
        setBinaryResult(bytes, "ebook.pdf", "application/pdf", document.getPageCount());
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

  function resetWorkbench() {
    clearResult();
    setFiles([]);
    setOutput("");
    setError("");
    setProgress(0);
    setPageSelection("");
    setPdfInfo({ counts: [], thumbnails: [] });
    setExtractionStats(null);
  }

  function moveDocument(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    clearResult();
    setFiles(next);
    void inspectDocuments(next);
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
  const totalInputSize = files.reduce((sum, file) => sum + file.size, 0);
  let selectedPages: number[] = [];
  if (slug === "pdf-splitter" && pdfInfo.counts[0]) {
    try {
      selectedPages = parsePageSelection(pageSelection, pdfInfo.counts[0]);
    } catch {
      selectedPages = [];
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[1.35rem] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">Source</h2>
        {slug === "markdown-to-html" ? (
          <Textarea
            className="mt-4 min-h-80 font-mono text-sm"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        ) : (
          <>
            <FileDropzone
              accept={accept}
              files={files}
              multiple={multiple}
              maxFiles={multiple ? 50 : 1}
              maxFileSize={slug === "file-word-counter" ? 10 * 1024 * 1024 : slug === "image-to-pdf" ? 40 * 1024 * 1024 : 250 * 1024 * 1024}
              maxTotalSize={slug === "image-to-pdf" ? 300 * 1024 * 1024 : 750 * 1024 * 1024}
              disabled={busy}
              label={multiple ? "Choose files in order" : "Choose a document"}
              hint={multiple ? "Drop files here in the order they should be processed" : "Drop a supported file here or browse"}
              onError={setError}
              onFiles={(next) => {
                clearResult();
                setOutput("");
                setFiles(next);
                void inspectDocuments(next);
              }}
            />
          </>
        )}
        {pdfInfo.counts.length ? (
          <div className="mt-3 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
              <span>{pdfInfo.counts.reduce((sum, count) => sum + count, 0)} total pages</span>
              <span>{formatDocumentBytes(totalInputSize)}</span>
            </div>
            {multiple && files.length > 1 ? (
              <ol className="mt-3 space-y-2" aria-label="Document processing order">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--surface-raised)] px-3 py-2">
                    <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-[var(--accent-700)]">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--ink-900)]">{file.name} · {pdfInfo.counts[index] ?? "?"} pages</span>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--outline-soft)] disabled:opacity-30" disabled={index === 0 || busy} onClick={() => moveDocument(index, -1)} aria-label={`Move ${file.name} earlier`}>↑</button>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--outline-soft)] disabled:opacity-30" disabled={index === files.length - 1 || busy} onClick={() => moveDocument(index, 1)} aria-label={`Move ${file.name} later`}>↓</button>
                  </li>
                ))}
              </ol>
            ) : null}
            {pdfInfo.thumbnails.length ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-[var(--ink-900)]">Page preview {pdfInfo.thumbnails.length < (pdfInfo.counts[0] ?? 0) ? `· first ${pdfInfo.thumbnails.length}` : ""}</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {pdfInfo.thumbnails.map((thumbnail, index) => {
                    const selected = slug !== "pdf-splitter" || !pageSelection.trim() || selectedPages.includes(index);
                    return (
                      <figure key={index} className={`overflow-hidden rounded-lg border-2 bg-white ${selected ? "border-[var(--accent-500)]" : "border-[var(--outline-soft)] opacity-45"}`}>
                        <img src={thumbnail} alt={`Preview of page ${index + 1}`} className="aspect-[3/4] w-full object-contain" />
                        <figcaption className="border-t border-slate-200 py-1 text-center text-[10px] font-semibold text-slate-700">{index + 1}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {slug === "pdf-splitter" ? (
          <label className="mt-4 block text-sm font-medium">
            Pages to export
            <Input className="mt-2" value={pageSelection} onChange={(event) => setPageSelection(event.target.value)} placeholder="All pages, or 1,3-5,8" inputMode="numeric" />
            <span className="mt-2 block text-xs text-[var(--muted-foreground)]">Leave blank for every page. Ranges are inclusive.</span>
          </label>
        ) : null}
        {slug === "pdf-text-extractor" ? (
          <fieldset className="mt-4 space-y-3">
            <legend className="text-sm font-medium text-[var(--ink-900)]">
              Extraction settings
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  {
                    value: "reading-order",
                    title: "Reading order",
                    detail: "Follows the PDF text stream and rebuilds lines.",
                  },
                  {
                    value: "preserve-layout",
                    title: "Preserve layout",
                    detail: "Uses page coordinates for columns and tables.",
                  },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`rounded-xl border p-3 text-left ${
                    pdfTextMode === mode.value
                      ? "border-[var(--accent-400)] bg-[var(--accent-50)] ring-1 ring-[var(--accent-300)]"
                      : "border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                  }`}
                  onClick={() => setPdfTextMode(mode.value)}
                >
                  <span className="block text-xs font-bold text-[var(--ink-900)]">
                    {mode.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-[var(--muted-foreground)]">
                    {mode.detail}
                  </span>
                </button>
              ))}
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 text-xs leading-5">
              <input
                className="mt-1 accent-[var(--accent-500)]"
                type="checkbox"
                checked={joinHyphenated}
                onChange={(event) => setJoinHyphenated(event.target.checked)}
              />
              Join words broken across lines with a hyphen
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3 text-xs leading-5">
              <input
                className="mt-1 accent-[var(--accent-500)]"
                type="checkbox"
                checked={includePageHeaders}
                onChange={(event) => setIncludePageHeaders(event.target.checked)}
              />
              Include page separators in the text output
            </label>
          </fieldset>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" disabled={busy || (fileRequired ? !files.length : !text.trim())} onClick={() => void processFiles()}>Process document</Button>
          {files.length || output || result ? <Button type="button" variant="secondary" onClick={resetWorkbench}>Reset</Button> : null}
        </div>
        <ProcessingProgress active={busy} progress={progress || undefined} label="Processing document" />
        <PrivacyNotice />
        <WorkbenchError message={error} />
      </section>
      <section className="rounded-[1.35rem] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
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
            srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font:16px/1.65 system-ui;padding:24px;color:#0f172a}pre,code{background:#f1f5f9;border-radius:6px}pre{padding:12px;overflow:auto}blockquote{border-left:3px solid #047857;margin-left:0;padding-left:16px;color:#475569}</style>${output}`}
            className="mt-4 min-h-96 w-full rounded-xl border border-[var(--outline-soft)] bg-white"
          />
        ) : output ? (
          <>
            {slug === "pdf-text-extractor" && extractionStats ? (
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Pages", extractionStats.pages],
                  ["Text items", extractionStats.textItems],
                  ["Words", extractionStats.words],
                  ["Characters", extractionStats.characters],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-3"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                      {label}
                    </dt>
                    <dd className="mt-1 font-bold tabular-nums text-[var(--ink-900)]">
                      {Number(value).toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <pre className="mt-4 min-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-sm leading-7">
              {output}
            </pre>
          </>
        ) : result ? (
          <div className="mt-4">
            {result.type === "application/pdf" ? (
              <iframe title={`Preview of ${result.name}`} src={result.url} className="mb-4 h-96 w-full rounded-xl border border-[var(--outline-soft)] bg-white" />
            ) : null}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="font-semibold">{result.name} is ready</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {totalInputSize ? <div><dt className="text-xs opacity-70">Original size</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatDocumentBytes(totalInputSize)}</dd></div> : null}
                <div><dt className="text-xs opacity-70">Output size</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatDocumentBytes(result.size)}</dd></div>
                {totalInputSize ? <div><dt className="text-xs opacity-70">Size change</dt><dd className="mt-0.5 font-semibold tabular-nums">{documentSizeChange(totalInputSize, result.size)}</dd></div> : null}
                {result.pageCount ? <div><dt className="text-xs opacity-70">{result.type === "application/zip" ? "Pages exported" : "Validated pages"}</dt><dd className="mt-0.5 font-semibold tabular-nums">{result.pageCount}</dd></div> : null}
              </dl>
              <p className="mt-3 text-xs">Generated and validated locally in this browser.</p>
              {totalInputSize && result.size > totalInputSize ? <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">The output is larger than the source. This can be normal for merged files, page archives, or newly embedded images.</p> : null}
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={resetWorkbench}>Process another document</Button>
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
