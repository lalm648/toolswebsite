"use client";

import NextImage from "next/image";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import ToolUploader from "@/components/tool/ToolUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent, trackToolFailure } from "@/lib/analytics";
import {
  exportCanvasWithStrategy,
  formatBytes,
  getSizeDelta,
  imagePreviewBackgroundClassName,
  loadImageFromUrl,
  replaceFileExtension,
  scaleDimensionsToFit,
  type ImageDimensions,
} from "@/lib/image-conversion";

type OutputFormat = "original" | "jpeg" | "webp" | "png";

type ConvertedImage = {
  url: string;
  size: number;
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
};

const acceptedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const outputOptions: { value: OutputFormat; label: string; description: string }[] = [
  { value: "original", label: "Original", description: "Keep the same format when possible." },
  { value: "webp", label: "WebP", description: "Best general-purpose compression for the web." },
  { value: "jpeg", label: "JPG", description: "Smaller files for photos and flat backgrounds." },
  { value: "png", label: "PNG", description: "Lossless export for graphics and transparency." },
];

function getFormatFromMimeType(mimeType: string): Exclude<OutputFormat, "original"> {
  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  return "jpeg";
}

function getOutputConfig(format: OutputFormat, sourceMimeType: string) {
  const resolvedFormat = format === "original" ? getFormatFromMimeType(sourceMimeType) : format;

  switch (resolvedFormat) {
    case "jpeg":
      return { mimeType: "image/jpeg", extension: "jpg", label: "JPG", fillBackgroundColor: "#ffffff" };
    case "webp":
      return { mimeType: "image/webp", extension: "webp", label: "WebP", fillBackgroundColor: undefined };
    case "png":
      return { mimeType: "image/png", extension: "png", label: "PNG", fillBackgroundColor: undefined };
  }
}

function getSmartQualityCandidates(qualityPercent: number, mimeType: string) {
  if (mimeType === "image/png") {
    return undefined;
  }

  return Array.from(
    new Set(
      [qualityPercent, qualityPercent - 8, qualityPercent - 16, qualityPercent - 24]
        .filter((value) => value >= 20)
        .map((value) => Number((value / 100).toFixed(2)))
    )
  );
}

export default function ImageCompressorTool() {
  const fileInputId = "image-compressor-upload-input";
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const [qualityPercent, setQualityPercent] = useState(76);
  const [maxWidthInput, setMaxWidthInput] = useState("");
  const [maxHeightInput, setMaxHeightInput] = useState("");
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (converted?.url) URL.revokeObjectURL(converted.url);
    };
  }, [previewUrl, converted]);

  function handleSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      trackToolFailure("image-compressor", "select_file", "unsupported_file_type", {
        input_type: selectedFile.type || "unknown",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (converted?.url) URL.revokeObjectURL(converted.url);

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setOriginalDimensions(null);

    void loadImageFromUrl(nextPreviewUrl)
      .then((image) => {
        setOriginalDimensions({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      })
      .catch(() => {
        setError("This image could not be processed.");
        trackToolFailure("image-compressor", "load_image", "image_load_failed", {
          input_type: selectedFile.type,
          input_size: selectedFile.size,
        });
      });

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setConverted(null);
    setError("");
    setOutputFormat(selectedFile.type === "image/png" ? "webp" : "original");
    setMaxWidthInput("");
    setMaxHeightInput("");
    setIsAspectRatioLocked(true);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function getHeightFromWidth(widthValue: string) {
    if (!originalDimensions || !widthValue) {
      return "";
    }

    const nextWidth = Number(widthValue);

    if (!nextWidth) {
      return "";
    }

    return String(Math.max(1, Math.round((nextWidth * originalDimensions.height) / originalDimensions.width)));
  }

  function handleDragEnter() {
    setIsDragActive(true);
  }

  function handleDragLeave() {
    setIsDragActive(false);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    handleSelect(event.dataTransfer.files?.[0] ?? null);
  }

  async function compressImage() {
    if (!file || !previewUrl) return;

    setIsCompressing(true);
    setError("");

    try {
      const image = await loadImageFromUrl(previewUrl);
      const maxWidth = Number(maxWidthInput) || undefined;
      const maxHeight = Number(maxHeightInput) || undefined;
      const nextDimensions = scaleDimensionsToFit(image.naturalWidth, image.naturalHeight, maxWidth, maxHeight);
      const outputConfig = getOutputConfig(outputFormat, file.type);

      const canvas = document.createElement("canvas");
      canvas.width = nextDimensions.width;
      canvas.height = nextDimensions.height;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Your browser could not start image compression.");
        setIsCompressing(false);
        trackToolFailure("image-compressor", "compress", "canvas_context_unavailable", {
          input_type: file.type,
          input_size: file.size,
        });
        return;
      }

      if (outputConfig.fillBackgroundColor) {
        context.fillStyle = outputConfig.fillBackgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0, nextDimensions.width, nextDimensions.height);

      const baseQuality = outputConfig.mimeType === "image/png" ? 1 : qualityPercent / 100;
      const blob = await exportCanvasWithStrategy(canvas, {
        outputMimeType: outputConfig.mimeType,
        outputQuality: baseQuality,
        qualityCandidates: getSmartQualityCandidates(qualityPercent, outputConfig.mimeType),
        targetMaxSizeRatio: outputConfig.mimeType === "image/png" ? undefined : 0.65,
        originalSize: file.size,
      });

      if (!blob) {
        setError(`This browser could not export ${outputConfig.label}. Try another format.`);
        setIsCompressing(false);
        trackToolFailure("image-compressor", "compress", "export_failed", {
          input_type: file.type,
          output_format: outputConfig.extension,
          input_size: file.size,
        });
        return;
      }

      if (converted?.url) URL.revokeObjectURL(converted.url);

      const nextUrl = URL.createObjectURL(blob);
      setConverted({
        url: nextUrl,
        size: blob.size,
        width: nextDimensions.width,
        height: nextDimensions.height,
        fileName: replaceFileExtension(file.name, outputConfig.extension),
        mimeType: outputConfig.mimeType,
      });
      trackEvent("compress_image", {
        tool_slug: "image-compressor",
        input_type: file.type,
        output_format: outputConfig.extension,
        input_size: file.size,
        output_size: blob.size,
        quality_percent: qualityPercent,
        max_width: maxWidth || undefined,
        max_height: maxHeight || undefined,
      });
      setIsCompressing(false);
    } catch {
      setError("This image could not be compressed.");
      setIsCompressing(false);
      trackToolFailure("image-compressor", "compress", "processing_failed", {
        input_type: file.type,
        input_size: file.size,
      });
    }
  }

  function resetTool() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (converted?.url) URL.revokeObjectURL(converted.url);
    setFile(null);
    setPreviewUrl("");
    setOriginalDimensions(null);
    setConverted(null);
    setError("");
    setQualityPercent(76);
    setMaxWidthInput("");
    setMaxHeightInput("");
    setIsAspectRatioLocked(true);
    setOutputFormat("webp");
    if (inputRef.current) inputRef.current.value = "";
  }

  const inputUsesTransparencyBackground = file?.type === "image/png";
  const outputUsesTransparencyBackground = converted?.mimeType === "image/png" || converted?.mimeType === "image/webp";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <ToolUploader
          title="Upload image"
          description="Compress JPG, PNG, or WebP images directly in the browser. Adjust quality, resize if needed, and download the optimized file."
          buttonLabel={file ? "Choose another image" : "Upload now"}
          onButtonClick={openPicker}
          fileInputId={fileInputId}
          isProcessing={isCompressing}
          processingLabel="Compressing image"
          dropHint="or drag and drop an image here"
          isDragActive={isDragActive}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          helperText="JPG, PNG, and WebP files only"
        >
          <input
            ref={inputRef}
            id={fileInputId}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">{file.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {formatBytes(file.size)}
                    {originalDimensions ? ` · ${originalDimensions.width} × ${originalDimensions.height}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
                  Ready to compress
                </Badge>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Quality</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Lower quality usually means a smaller file size.
                    </p>
                  </div>
                  <Badge variant="secondary" className="min-w-16 justify-center normal-case tracking-normal">
                    {qualityPercent}%
                  </Badge>
                </div>
                <input
                  type="range"
                  min={25}
                  max={95}
                  step={1}
                  value={qualityPercent}
                  onChange={(event) => {
                    setQualityPercent(Number(event.target.value));
                    setConverted(null);
                  }}
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--outline-soft)] accent-[var(--accent-500)]"
                  aria-label="Compression quality"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>25%</span>
                  <span>95%</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Resize limits</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Leave empty to keep the original dimensions.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isAspectRatioLocked ? "default" : "secondary"}
                    size="sm"
                    onClick={() => {
                      const nextLocked = !isAspectRatioLocked;
                      setIsAspectRatioLocked(nextLocked);
                      setConverted(null);

                      if (nextLocked) {
                        setMaxHeightInput(getHeightFromWidth(maxWidthInput));
                      }
                    }}
                  >
                    {isAspectRatioLocked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Width"
                    value={maxWidthInput}
                    onChange={(event) => {
                      const nextWidth = event.target.value;
                      setMaxWidthInput(nextWidth);
                      if (isAspectRatioLocked) {
                        setMaxHeightInput(getHeightFromWidth(nextWidth));
                      }
                      setConverted(null);
                    }}
                  />
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Height"
                    value={maxHeightInput}
                    onChange={(event) => {
                      if (isAspectRatioLocked) {
                        return;
                      }
                      setMaxHeightInput(event.target.value);
                      setConverted(null);
                    }}
                    disabled={isAspectRatioLocked}
                  />
                </div>
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  {isAspectRatioLocked
                    ? "Height updates automatically from the width using the original image ratio."
                    : "Width and height can now be edited independently."}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                <p className="text-sm font-semibold text-[var(--ink-900)]">Output format</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {outputOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setOutputFormat(option.value);
                        setConverted(null);
                      }}
                      className={`rounded-2xl border p-3 text-left shadow-[var(--shadow-soft)] ${
                        outputFormat === option.value
                          ? "border-[var(--accent-500)] bg-[var(--accent-50)]"
                          : "border-[var(--outline-soft)] bg-[var(--surface-raised)]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--ink-900)]">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={compressImage} disabled={isCompressing}>
                  {isCompressing ? "Compressing..." : "Compress image"}
                </Button>
                <Button variant="secondary" onClick={resetTool}>
                  Reset
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[var(--brand-600)]">{error}</p> : null}
        </ToolUploader>
      </div>

      <ToolResult title="Preview and download" isProcessing={isCompressing} processingLabel="Building compressed preview">
        {previewUrl ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Original image</p>
                <div
                  className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                    imagePreviewBackgroundClassName[inputUsesTransparencyBackground ? "checkerboard" : "plain"]
                  }`}
                >
                  <NextImage
                    src={previewUrl}
                    alt="Original image preview"
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Compressed result</p>
                {converted ? (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                      imagePreviewBackgroundClassName[outputUsesTransparencyBackground ? "checkerboard" : "white"]
                    }`}
                  >
                    <NextImage
                      src={converted.url}
                      alt="Compressed image preview"
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] text-sm text-[var(--muted-foreground)]">
                    {isCompressing ? "Building compressed image..." : "Compressed preview will appear here"}
                  </div>
                )}
              </div>
            </div>

            {converted ? (
              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{converted.fileName}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {converted.width} × {converted.height} · {formatBytes(converted.size)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {file ? getSizeDelta(converted.size, file.size) ?? "Size comparison unavailable" : "Size comparison unavailable"}
                    </p>
                  </div>
                  <Button asChild>
                    <a
                      href={converted.url}
                      download={converted.fileName}
                      onClick={() =>
                        trackEvent("download_result", {
                          tool_slug: "image-compressor",
                          output_format: converted.mimeType,
                          file_name: converted.fileName,
                        })
                      }
                    >
                      Download image
                    </a>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] text-center text-sm text-[var(--muted-foreground)]">
            Upload an image to compress it and compare the result here.
          </div>
        )}
      </ToolResult>
    </div>
  );
}
