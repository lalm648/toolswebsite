"use client";

/* eslint-disable @next/next/no-img-element -- Generated blob URLs are local processing previews. */

import { useEffect, useRef, useState } from "react";
import FileDropzone from "@/components/tool/FileDropzone";
import { PrivacyNotice, ProcessingProgress, WorkbenchError } from "@/components/tool/WorkbenchStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodeCanvasToAvif } from "@/lib/avif-encoder";
import { stripImageMetadata } from "@/lib/tools/strip-metadata";
import {
  formatBytes,
  replaceFileExtension,
  resolveOutputDimensions,
  toBlobFromCanvas,
} from "@/lib/image-conversion";

type ImageUtilityWorkbenchProps = { slug: string };
type ImageResult = {
  url: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  originalName?: string;
  originalSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  transparency?: boolean;
  removedMetadata?: string[];
};

function imageSizeChange(original?: number, output?: number) {
  if (!original || output === undefined) return "";
  const change = ((original - output) / original) * 100;
  return change >= 0
    ? `${change.toFixed(1)}% smaller`
    : `${Math.abs(change).toFixed(1)}% larger`;
}

const multiFileSlugs = new Set([
  "bulk-image-resizer",
  "format-converter",
  "watermarker",
  "metadata-stripper",
  "gif-maker",
]);

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`${file.name} is not a readable image.`));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasFor(
  image: CanvasImageSource,
  width: number,
  height: number,
  backgroundColor?: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context)
    throw new Error("Canvas processing is unavailable in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  // Formats without an alpha channel must be flattened first, or transparent regions
  // encode as black instead of the chosen background.
  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

/** Keeps a file in the format it arrived in, so a resize never silently re-containers it. */
function sourceFormatOf(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

function canvasHasTransparency(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  const alpha = context.getImageData(0, 0, width, height).data;
  const stride = Math.max(4, Math.floor((width * height) / 250_000) * 4);
  for (let index = 3; index < alpha.length; index += stride) {
    if (alpha[index] < 255) return true;
  }
  return false;
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number,
) {
  if (format === "avif") return encodeCanvasToAvif(canvas, quality * 100);
  const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
  const blob = await toBlobFromCanvas(canvas, mime, quality);
  if (!blob || blob.type !== mime)
    throw new Error(
      `${format.toUpperCase()} encoding is not supported in this browser.`,
    );
  return blob;
}

function smartCropSource(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  targetRatio: number,
) {
  const sampleWidth = 64;
  const sampleHeight = Math.max(1, Math.round((height / width) * sampleWidth));
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const sampleContext = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) return { x: 0, y: 0, width, height };
  sampleContext.drawImage(context.canvas, 0, 0, sampleWidth, sampleHeight);
  const pixels = sampleContext.getImageData(
    0,
    0,
    sampleWidth,
    sampleHeight,
  ).data;
  let weightTotal = 0,
    weightedX = 0,
    weightedY = 0;
  for (let y = 1; y < sampleHeight - 1; y += 1)
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const index = (y * sampleWidth + x) * 4;
      const luminance = (offset: number) =>
        pixels[offset] * 0.299 +
        pixels[offset + 1] * 0.587 +
        pixels[offset + 2] * 0.114;
      const contrast =
        Math.abs(luminance(index) - luminance(index - 4)) +
        Math.abs(luminance(index) - luminance(index - sampleWidth * 4));
      if (contrast > 18) {
        weightTotal += contrast;
        weightedX += x * contrast;
        weightedY += y * contrast;
      }
    }
  const focusX = weightTotal
    ? (weightedX / weightTotal / sampleWidth) * width
    : width / 2;
  const focusY = weightTotal
    ? (weightedY / weightTotal / sampleHeight) * height
    : height / 2;
  let cropWidth = width,
    cropHeight = height;
  if (width / height > targetRatio) cropWidth = height * targetRatio;
  else cropHeight = width / targetRatio;
  return {
    x: Math.max(0, Math.min(width - cropWidth, focusX - cropWidth / 2)),
    y: Math.max(0, Math.min(height - cropHeight, focusY - cropHeight / 2)),
    width: cropWidth,
    height: cropHeight,
  };
}

function removeEdgeBackground(
  context: CanvasRenderingContext2D,
  tolerance: number,
) {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const background = corners
    .reduce(
      (sum, [x, y]) => {
        const i = (y * width + x) * 4;
        return [sum[0] + data[i], sum[1] + data[i + 1], sum[2] + data[i + 2]];
      },
      [0, 0, 0],
    )
    .map((value) => value / 4);
  const visited = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let size = 0;
  const enqueue = (position: number) => {
    if (!visited[position]) {
      visited[position] = 1;
      stack[size++] = position;
    }
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (size) {
    const position = stack[--size],
      x = position % width,
      y = Math.floor(position / width),
      index = position * 4;
    const distance = Math.hypot(
      data[index] - background[0],
      data[index + 1] - background[1],
      data[index + 2] - background[2],
    );
    if (distance > tolerance) continue;
    data[index + 3] = 0;
    if (x > 0) enqueue(position - 1);
    if (x < width - 1) enqueue(position + 1);
    if (y > 0) enqueue(position - width);
    if (y < height - 1) enqueue(position + width);
  }
  context.putImageData(image, 0, 0);
}

function extractPalette(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const counts = new Map<string, number>();
  const step = Math.max(1, Math.floor((width * height) / 100_000));
  for (let pixel = 0; pixel < width * height; pixel += step) {
    const i = pixel * 4;
    if (pixels[i + 3] < 128) continue;
    const r = Math.round(pixels[i] / 32) * 32,
      g = Math.round(pixels[i + 1] / 32) * 32,
      b = Math.round(pixels[i + 2] / 32) * 32;
    const key = `#${Math.min(255, r).toString(16).padStart(2, "0")}${Math.min(255, g).toString(16).padStart(2, "0")}${Math.min(255, b).toString(16).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color.toUpperCase());
}

function wrapCaption(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const next = `${line} ${word}`.trim();
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function createIco(pngs: Array<{ size: number; blob: Blob }>) {
  const buffers = await Promise.all(
    pngs.map(async ({ size, blob }) => ({
      size,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    })),
  );
  const headerSize = 6 + buffers.length * 16;
  const total =
    headerSize + buffers.reduce((sum, item) => sum + item.bytes.length, 0);
  const output = new Uint8Array(total);
  const view = new DataView(output.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, buffers.length, true);
  let offset = headerSize;
  buffers.forEach((item, index) => {
    const entry = 6 + index * 16;
    output[entry] = item.size === 256 ? 0 : item.size;
    output[entry + 1] = item.size === 256 ? 0 : item.size;
    output[entry + 2] = 0;
    output[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, item.bytes.length, true);
    view.setUint32(entry + 12, offset, true);
    output.set(item.bytes, offset);
    offset += item.bytes.length;
  });
  return output;
}

export default function ImageUtilityWorkbench({
  slug,
}: ImageUtilityWorkbenchProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [markFile, setMarkFile] = useState<File | null>(null);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [palette, setPalette] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(0);
  const [format, setFormat] = useState(
    slug === "bulk-image-resizer" ? "original" : "webp",
  );
  const [quality, setQuality] = useState(84);
  const [watermark, setWatermark] = useState("© Webutilia");
  const [tolerance, setTolerance] = useState(52);
  const [background, setBackground] = useState("#ffffff");
  const [ratio, setRatio] = useState("1:1");
  const [delay, setDelay] = useState(500);
  const [topText, setTopText] = useState("TOP TEXT");
  const [bottomText, setBottomText] = useState("BOTTOM TEXT");
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [fitPreview, setFitPreview] = useState(true);
  const canceledRef = useRef(false);
  useEffect(
    () => () => {
      results.forEach((result) => URL.revokeObjectURL(result.url));
    },
    [results],
  );
  useEffect(
    () => () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    },
    [sourcePreviewUrl],
  );
  function replaceResults(next: ImageResult[]) {
    results.forEach((result) => URL.revokeObjectURL(result.url));
    setResults(next);
  }
  async function processImages() {
    canceledRef.current = false;
    setBusy(true);
    setError("");
    setPalette([]);
    replaceResults([]);
    setProgress(0);
    try {
      if (slug === "gif-maker") {
        const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
        const loaded = await Promise.all(files.map(loadImage));
        const frameWidth = Math.min(800, loaded[0].naturalWidth);
        const frameHeight = Math.round(
          frameWidth * (loaded[0].naturalHeight / loaded[0].naturalWidth),
        );
        const gif = GIFEncoder();
        for (let i = 0; i < loaded.length; i += 1) {
          if (canceledRef.current) throw new Error("Processing canceled.");
          const { context } = canvasFor(loaded[i], frameWidth, frameHeight);
          const data = context.getImageData(0, 0, frameWidth, frameHeight).data;
          const colors = quantize(data, 256);
          gif.writeFrame(applyPalette(data, colors), frameWidth, frameHeight, {
            palette: colors,
            delay,
            repeat: 0,
          });
          setProgress((i + 1) / loaded.length);
        }
        gif.finish();
        const blob = new Blob([new Uint8Array(gif.bytes()).buffer], {
          type: "image/gif",
        });
        replaceResults([
          {
            url: URL.createObjectURL(blob),
            name: "animation.gif",
            size: blob.size,
            type: blob.type,
            width: frameWidth,
            height: frameHeight,
            originalName: `${files.length} source frames`,
            originalSize: files.reduce((sum, file) => sum + file.size, 0),
            originalWidth: loaded[0].naturalWidth,
            originalHeight: loaded[0].naturalHeight,
          },
        ]);
        return;
      }
      if (slug === "favicon-generator") {
        const [image, JSZipModule] = await Promise.all([
          loadImage(files[0]),
          import("jszip"),
        ]);
        const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
        const pngs = [] as Array<{ size: number; blob: Blob }>;
        const zip = new JSZipModule.default();
        for (const size of sizes) {
          if (canceledRef.current) throw new Error("Processing canceled.");
          const { canvas } = canvasFor(image, size, size);
          const blob = await encodeCanvas(canvas, "png", 1);
          pngs.push({ size, blob });
          zip.file(`icon-${size}.png`, blob);
        }
        zip.file(
          "favicon.ico",
          await createIco(pngs.filter((item) => item.size <= 256)),
        );
        const blob = await zip.generateAsync({ type: "blob" });
        replaceResults([
          {
            url: URL.createObjectURL(blob),
            name: "favicon-package.zip",
            size: blob.size,
            type: blob.type,
            originalName: files[0].name,
            originalSize: files[0].size,
            originalWidth: image.naturalWidth,
            originalHeight: image.naturalHeight,
          },
        ]);
        return;
      }
      const next: ImageResult[] = [];
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        if (canceledRef.current) throw new Error("Processing canceled.");
        const file = files[fileIndex];

        if (slug === "metadata-stripper") {
          // Container-level strip: the compressed image data is copied verbatim, so the
          // result is bit-identical in appearance. A canvas re-encode would recompress.
          const source = new Uint8Array(await file.arrayBuffer());
          const stripped = stripImageMetadata(source);

          if (stripped.lossless) {
            const blob = new Blob([stripped.bytes.slice().buffer], { type: file.type });
            next.push({
              url: URL.createObjectURL(blob),
              name: file.name,
              size: blob.size,
              type: file.type,
              originalName: file.name,
              originalSize: file.size,
              removedMetadata: stripped.removed,
            });
            setProgress((fileIndex + 1) / files.length);
            continue;
          }
        }

        const image = await loadImage(file);
        // Resolved up front because a format without an alpha channel needs the canvas
        // flattened onto a colour before the image is drawn, not after.
        const outputFormat =
          slug === "metadata-stripper"
            ? sourceFormatOf(file)
            : slug === "background-remover"
              ? "png"
              : slug === "watermarker"
                ? sourceFormatOf(file)
                : slug === "smart-image-cropper" || slug === "meme-generator"
                  ? "jpg"
                  : format === "original"
                    ? sourceFormatOf(file)
                    : format;
        const flattenColor = outputFormat === "jpg" ? background : undefined;
        let targetWidth = image.naturalWidth,
          targetHeight = image.naturalHeight;
        if (slug === "bulk-image-resizer") {
          const resolved = resolveOutputDimensions(
            image.naturalWidth,
            image.naturalHeight,
            width > 0 ? width : undefined,
            height > 0 ? height : undefined,
          );
          targetWidth = resolved.width;
          targetHeight = resolved.height;
        }
        let { canvas, context } = canvasFor(
          image,
          targetWidth,
          targetHeight,
          flattenColor,
        );
        if (slug === "background-remover")
          removeEdgeBackground(context, tolerance);
        if (slug === "watermarker") {
          context.save();
          context.globalAlpha = 0.72;
          if (markFile) {
            const mark = await loadImage(markFile);
            const markWidth = canvas.width * 0.24;
            const markHeight =
              markWidth * (mark.naturalHeight / mark.naturalWidth);
            context.drawImage(
              mark,
              canvas.width - markWidth - 24,
              canvas.height - markHeight - 24,
              markWidth,
              markHeight,
            );
          } else {
            const fontSize = Math.max(18, Math.round(canvas.width * 0.035));
            context.font = `700 ${fontSize}px system-ui`;
            context.textAlign = "right";
            context.textBaseline = "bottom";
            context.fillStyle = "white";
            context.strokeStyle = "rgba(0,0,0,.65)";
            context.lineWidth = Math.max(2, fontSize * 0.08);
            context.strokeText(
              watermark,
              canvas.width - 24,
              canvas.height - 20,
            );
            context.fillText(watermark, canvas.width - 24, canvas.height - 20);
          }
          context.restore();
        }
        if (slug === "smart-image-cropper") {
          const [rw, rh] = ratio.split(":").map(Number);
          const crop = smartCropSource(
            context,
            canvas.width,
            canvas.height,
            rw / rh,
          );
          const outputWidth = 1200,
            outputHeight = Math.round(outputWidth / (rw / rh));
          const nextCanvas = document.createElement("canvas");
          nextCanvas.width = outputWidth;
          nextCanvas.height = outputHeight;
          const nextContext = nextCanvas.getContext("2d");
          if (!nextContext) throw new Error("Canvas unavailable.");
          nextContext.drawImage(
            canvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            outputWidth,
            outputHeight,
          );
          canvas = nextCanvas;
          context = nextContext;
        }
        if (slug === "color-palette-extractor") {
          setPalette(extractPalette(context));
          setProgress(1);
          continue;
        }
        if (slug === "meme-generator") {
          const fontSize = Math.max(28, Math.round(canvas.width * 0.075));
          context.font = `900 ${fontSize}px Impact, sans-serif`;
          context.textAlign = "center";
          context.lineJoin = "round";
          context.lineWidth = Math.max(3, fontSize * 0.08);
          context.strokeStyle = "black";
          context.fillStyle = "white";
          const draw = (caption: string, top: boolean) => {
            const lines = wrapCaption(context, caption, canvas.width * 0.9);
            lines.forEach((line, index) => {
              const y = top
                ? fontSize * 1.15 + index * fontSize * 1.05
                : canvas.height -
                  fontSize * 0.35 -
                  (lines.length - 1 - index) * fontSize * 1.05;
              context.strokeText(line, canvas.width / 2, y);
              context.fillText(line, canvas.width / 2, y);
            });
          };
          draw(topText, true);
          draw(bottomText, false);
        }
        const blob = await encodeCanvas(canvas, outputFormat, quality / 100);
        next.push({
          url: URL.createObjectURL(blob),
          name: replaceFileExtension(file.name, outputFormat),
          size: blob.size,
          type: blob.type,
          width: canvas.width,
          height: canvas.height,
          originalName: file.name,
          originalSize: file.size,
          originalWidth: image.naturalWidth,
          originalHeight: image.naturalHeight,
          transparency:
            ["png", "webp", "avif"].includes(outputFormat) &&
            canvasHasTransparency(context),
        });
        setProgress((fileIndex + 1) / files.length);
      }
      replaceResults(next);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The images could not be processed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function resetWorkbench() {
    canceledRef.current = true;
    replaceResults([]);
    setFiles([]);
    setSourcePreviewUrl("");
    setMarkFile(null);
    setPalette([]);
    setError("");
    setProgress(0);
  }
  async function downloadAll() {
    if (results.length === 1) {
      const anchor = document.createElement("a");
      anchor.href = results[0].url;
      anchor.download = results[0].name;
      anchor.click();
      return;
    }
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const result of results)
      zip.file(result.name, await (await fetch(result.url)).blob());
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "processed-images.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const multiple = multiFileSlugs.has(slug);
  const needsFormat =
    slug === "format-converter" || slug === "bulk-image-resizer";
  const formatOptions =
    slug === "bulk-image-resizer"
      ? ["original", "webp", "avif", "jpg", "png"]
      : ["webp", "avif", "jpg", "png"];
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[1.35rem] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--ink-900)]">
          Images and settings
        </h2>
        <FileDropzone
          accept="image/jpeg,image/png,image/webp"
          files={files}
          multiple={multiple}
          maxFiles={50}
          maxFileSize={40 * 1024 * 1024}
          maxTotalSize={300 * 1024 * 1024}
          disabled={busy}
          label={multiple ? "Choose images" : "Choose an image"}
          hint="JPEG, PNG, or WebP · drag and drop supported"
          onError={setError}
          onFiles={(next) => {
            replaceResults([]);
            setPalette([]);
            setFiles(next);
            setSourcePreviewUrl(next[0] ? URL.createObjectURL(next[0]) : "");
          }}
        />
        {slug === "bulk-image-resizer" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Maximum width
              <Input
                className="mt-2"
                type="number"
                min="0"
                max="12000"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-medium">
              Maximum height
              <Input
                className="mt-2"
                type="number"
                min="0"
                max="12000"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
              <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">
                Leave at 0 to size by width alone. Images are never enlarged.
              </span>
            </label>
          </div>
        ) : null}
        {needsFormat ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Output format
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                {formatOptions.map((value) => (
                  <option key={value} value={value}>
                    {value === "original" ? "Keep original" : value.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Quality: {quality}%
              <input
                className="mt-4 w-full accent-[var(--accent-500)]"
                type="range"
                min="20"
                max="100"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
              />
            </label>
            {format === "jpg" ? (
              <label className="text-sm font-medium sm:col-span-2">
                Background for transparent areas
                <span className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                    aria-label="Background colour for transparent areas"
                  />
                  <span className="text-xs font-normal text-[var(--muted-foreground)]">
                    JPG has no transparency, so transparent pixels are filled with this
                    colour.
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        ) : null}
        {slug === "background-remover" ? (
          <label className="mt-4 block text-sm font-medium">
            Edge color tolerance: {tolerance}
            <input
              className="mt-3 w-full accent-[var(--accent-500)]"
              type="range"
              min="10"
              max="160"
              value={tolerance}
              onChange={(event) => setTolerance(Number(event.target.value))}
            />
            <span className="mt-2 block text-xs leading-5 text-[var(--muted-foreground)]">
              Best for subjects on a consistent background. Increase until the
              connected edge background disappears.
            </span>
          </label>
        ) : null}
        {slug === "watermarker" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              Text watermark
              <Input
                className="mt-2"
                value={watermark}
                onChange={(event) => setWatermark(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Or transparent PNG logo
              <Input
                className="mt-2"
                type="file"
                accept="image/png"
                onChange={(event) =>
                  setMarkFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
        ) : null}
        {slug === "smart-image-cropper" ? (
          <label className="mt-4 block text-sm font-medium">
            Target ratio
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4"
              value={ratio}
              onChange={(event) => setRatio(event.target.value)}
            >
              {["1:1", "4:5", "16:9", "9:16", "3:2"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ) : null}
        {slug === "gif-maker" ? (
          <label className="mt-4 block text-sm font-medium">
            Frame delay: {delay} ms
            <input
              className="mt-3 w-full accent-[var(--accent-500)]"
              type="range"
              min="80"
              max="2000"
              step="20"
              value={delay}
              onChange={(event) => setDelay(Number(event.target.value))}
            />
          </label>
        ) : null}
        {slug === "meme-generator" ? (
          <div className="mt-4 space-y-3">
            <Input
              value={topText}
              onChange={(event) => setTopText(event.target.value)}
              placeholder="Top text"
            />
            <Input
              value={bottomText}
              onChange={(event) => setBottomText(event.target.value)}
              placeholder="Bottom text"
            />
          </div>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" disabled={busy || !files.length} onClick={() => void processImages()}>
            Process locally
          </Button>
          {files.length || results.length || palette.length ? (
            <Button type="button" variant="secondary" onClick={resetWorkbench}>Reset</Button>
          ) : null}
        </div>
        <ProcessingProgress active={busy} progress={progress} label="Processing images" onCancel={() => { canceledRef.current = true; }} />
        <PrivacyNotice />
        <WorkbenchError message={error} />
      </section>
      <section className="rounded-[1.35rem] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Results
          </h2>
          {results.length ? (
            <Button size="sm" onClick={() => void downloadAll()}>
              {results.length === 1 ? "Download" : "Download ZIP"}
            </Button>
          ) : null}
        </div>
        {palette.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {palette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => void navigator.clipboard.writeText(color)}
                className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] text-left"
              >
                <span
                  className="block h-20"
                  style={{ backgroundColor: color }}
                />
                <span className="block p-3 text-xs font-semibold">{color}</span>
              </button>
            ))}
          </div>
        ) : results.length ? (
          <div className={`mt-5 grid gap-4 ${results.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {results.length === 1 && results[0].type.startsWith("image/") ? (
              <div className="flex justify-end gap-1">
                <button type="button" className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${fitPreview ? "bg-[var(--accent-500)] text-white" : "border border-[var(--outline-soft)]"}`} onClick={() => setFitPreview(true)}>Fit</button>
                <button type="button" className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${!fitPreview ? "bg-[var(--accent-500)] text-white" : "border border-[var(--outline-soft)]"}`} onClick={() => setFitPreview(false)}>1:1</button>
              </div>
            ) : null}
            {results.map((result) => (
              <div
                key={result.url}
                className="overflow-hidden rounded-xl border border-[var(--outline-soft)] bg-[var(--surface-raised)]"
              >
                {result.type.startsWith("image/") ? (
                  <div className={`grid ${results.length === 1 && sourcePreviewUrl ? "sm:grid-cols-2" : ""}`}>
                    {results.length === 1 && sourcePreviewUrl ? (
                      <figure className="min-w-0 border-b border-[var(--outline-soft)] sm:border-b-0 sm:border-r">
                        <figcaption className="border-b border-[var(--outline-soft)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">Before</figcaption>
                        <div className="flex h-52 items-center justify-center overflow-auto bg-white p-3">
                          <img src={sourcePreviewUrl} alt={`Original preview of ${result.originalName ?? "source image"}`} className={fitPreview ? "max-h-full max-w-full object-contain" : "max-w-none"} />
                        </div>
                      </figure>
                    ) : null}
                    <figure className="min-w-0">
                      <figcaption className="border-b border-[var(--outline-soft)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">{results.length === 1 ? "After" : "Output"}</figcaption>
                      <div className="flex h-52 items-center justify-center overflow-auto bg-white p-3">
                        <img src={result.url} alt={`Preview of ${result.name}`} className={fitPreview ? "max-h-full max-w-full object-contain" : "max-w-none"} />
                      </div>
                    </figure>
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-[var(--accent-50)] px-4 text-center text-sm font-semibold text-[var(--accent-700)]">Download package ready</div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-[var(--ink-900)]">
                    {result.name}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    {result.originalSize ? <div><dt className="text-[var(--muted-foreground)]">Original</dt><dd className="mt-0.5 font-semibold tabular-nums text-[var(--ink-900)]">{formatBytes(result.originalSize)}</dd></div> : null}
                    <div><dt className="text-[var(--muted-foreground)]">Output</dt><dd className="mt-0.5 font-semibold tabular-nums text-[var(--ink-900)]">{formatBytes(result.size)}</dd></div>
                    {result.originalSize ? <div><dt className="text-[var(--muted-foreground)]">Size change</dt><dd className="mt-0.5 font-semibold tabular-nums text-[var(--ink-900)]">{imageSizeChange(result.originalSize, result.size)}</dd></div> : null}
                    {result.width && result.height ? <div><dt className="text-[var(--muted-foreground)]">Dimensions</dt><dd className="mt-0.5 font-semibold tabular-nums text-[var(--ink-900)]">{result.width}×{result.height}</dd></div> : null}
                    {result.originalWidth && result.originalHeight ? <div><dt className="text-[var(--muted-foreground)]">Original dimensions</dt><dd className="mt-0.5 font-semibold tabular-nums text-[var(--ink-900)]">{result.originalWidth}×{result.originalHeight}</dd></div> : null}
                    <div><dt className="text-[var(--muted-foreground)]">Format</dt><dd className="mt-0.5 font-semibold uppercase text-[var(--ink-900)]">{result.name.split(".").pop()}</dd></div>
                    {result.transparency !== undefined ? <div><dt className="text-[var(--muted-foreground)]">Transparency</dt><dd className="mt-0.5 font-semibold text-[var(--ink-900)]">{result.transparency ? "Present" : "None detected"}</dd></div> : null}
                  </dl>
                  {result.originalSize && result.size > result.originalSize ? (
                    <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">This output is larger than the source. Lower quality, reduce dimensions, or choose WebP/AVIF when a smaller file is the goal.</p>
                  ) : null}
                </div>
              </div>
            ))}
            {results.length ? <Button variant="secondary" className={`w-full ${results.length > 1 ? "sm:col-span-2" : ""}`} onClick={resetWorkbench}>Process another image</Button> : null}
          </div>
        ) : (
          <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-[var(--outline-strong)] px-5 text-center text-sm text-[var(--muted-foreground)]">
            Processed previews and downloads will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
