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
  formatBytes,
  getSizeDelta,
  imagePreviewBackgroundClassName,
  loadImageFromUrl,
  replaceFileExtension,
  toBlobFromCanvas,
  type ImageDimensions,
} from "@/lib/image-conversion";

type OutputFormat = "original" | "jpeg" | "png" | "webp";

type ResizedImage = {
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
  { value: "webp", label: "WebP", description: "Modern format for web delivery." },
  { value: "jpeg", label: "JPG", description: "Good for photos and smaller files." },
  { value: "png", label: "PNG", description: "Lossless output for graphics." },
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
      return { mimeType: "image/jpeg", extension: "jpg", label: "JPG", quality: 0.92, fillBackgroundColor: "#ffffff" };
    case "webp":
      return { mimeType: "image/webp", extension: "webp", label: "WebP", quality: 0.92, fillBackgroundColor: undefined };
    case "png":
      return { mimeType: "image/png", extension: "png", label: "PNG", quality: 1, fillBackgroundColor: undefined };
  }
}

export default function ImageResizerTool() {
  const fileInputId = "image-resizer-upload-input";
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [resized, setResized] = useState<ResizedImage | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resized?.url) URL.revokeObjectURL(resized.url);
    };
  }, [previewUrl, resized]);

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

  function getWidthFromHeight(heightValue: string) {
    if (!originalDimensions || !heightValue) {
      return "";
    }

    const nextHeight = Number(heightValue);

    if (!nextHeight) {
      return "";
    }

    return String(Math.max(1, Math.round((nextHeight * originalDimensions.width) / originalDimensions.height)));
  }

  function handleSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      trackToolFailure("image-resizer", "select_file", "unsupported_file_type", {
        input_type: selectedFile.type || "unknown",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resized?.url) URL.revokeObjectURL(resized.url);

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setOriginalDimensions(null);

    void loadImageFromUrl(nextPreviewUrl)
      .then((image) => {
        setOriginalDimensions({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
        setWidthInput(String(image.naturalWidth));
        setHeightInput(String(image.naturalHeight));
      })
      .catch(() => {
        setError("This image could not be processed.");
        trackToolFailure("image-resizer", "load_image", "image_load_failed", {
          input_type: selectedFile.type,
          input_size: selectedFile.size,
        });
      });

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setResized(null);
    setError("");
    setIsAspectRatioLocked(true);
    setOutputFormat("original");
  }

  function openPicker() {
    inputRef.current?.click();
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

  async function resizeImage() {
    if (!file || !previewUrl || !originalDimensions) return;

    const targetWidth = Number(widthInput);
    const targetHeight = Number(heightInput);

    if (!targetWidth || !targetHeight) {
      setError("Enter a valid width and height before resizing.");
      trackToolFailure("image-resizer", "resize", "invalid_dimensions", {
        width: targetWidth || undefined,
        height: targetHeight || undefined,
      });
      return;
    }

    setIsResizing(true);
    setError("");

    try {
      const image = await loadImageFromUrl(previewUrl);
      const outputConfig = getOutputConfig(outputFormat, file.type);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Your browser could not start image resizing.");
        setIsResizing(false);
        trackToolFailure("image-resizer", "resize", "canvas_context_unavailable", {
          input_type: file.type,
          input_size: file.size,
        });
        return;
      }

      if (outputConfig.fillBackgroundColor) {
        context.fillStyle = outputConfig.fillBackgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      const blob = await toBlobFromCanvas(canvas, outputConfig.mimeType, outputConfig.quality);

      if (!blob) {
        setError(`This browser could not export ${outputConfig.label}. Try another format.`);
        setIsResizing(false);
        trackToolFailure("image-resizer", "resize", "export_failed", {
          input_type: file.type,
          output_format: outputConfig.extension,
          input_size: file.size,
        });
        return;
      }

      if (resized?.url) URL.revokeObjectURL(resized.url);

      const nextUrl = URL.createObjectURL(blob);
      setResized({
        url: nextUrl,
        size: blob.size,
        width: targetWidth,
        height: targetHeight,
        fileName: replaceFileExtension(file.name, outputConfig.extension),
        mimeType: outputConfig.mimeType,
      });
      trackEvent("resize_image", {
        tool_slug: "image-resizer",
        input_type: file.type,
        output_format: outputConfig.extension,
        input_size: file.size,
        output_size: blob.size,
        width: targetWidth,
        height: targetHeight,
      });
      setIsResizing(false);
    } catch {
      setError("This image could not be resized.");
      setIsResizing(false);
      trackToolFailure("image-resizer", "resize", "processing_failed", {
        input_type: file.type,
        input_size: file.size,
      });
    }
  }

  function resetTool() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resized?.url) URL.revokeObjectURL(resized.url);
    setFile(null);
    setPreviewUrl("");
    setOriginalDimensions(null);
    setResized(null);
    setError("");
    setWidthInput("");
    setHeightInput("");
    setIsAspectRatioLocked(true);
    setOutputFormat("original");
    if (inputRef.current) inputRef.current.value = "";
  }

  const inputUsesTransparencyBackground = file?.type === "image/png";
  const outputUsesTransparencyBackground = resized?.mimeType === "image/png" || resized?.mimeType === "image/webp";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <ToolUploader
          title="Upload image"
          description="Resize JPG, PNG, or WebP images directly in the browser. Lock the aspect ratio by default, adjust dimensions, preview the result, and download the new file."
          buttonLabel={file ? "Choose another image" : "Upload now"}
          onButtonClick={openPicker}
          fileInputId={fileInputId}
          isProcessing={isResizing}
          processingLabel="Resizing image"
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
            className="mt-4 block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--accent-50)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--accent-700)] md:sr-only"
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
                  Ready to resize
                </Badge>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Dimensions</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Aspect ratio is locked by default.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isAspectRatioLocked ? "default" : "secondary"}
                    size="sm"
                    onClick={() => {
                      const nextLocked = !isAspectRatioLocked;
                      setIsAspectRatioLocked(nextLocked);
                      setResized(null);

                      if (nextLocked) {
                        setHeightInput(getHeightFromWidth(widthInput));
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
                    value={widthInput}
                    onChange={(event) => {
                      const nextWidth = event.target.value;
                      setWidthInput(nextWidth);
                      if (isAspectRatioLocked) {
                        setHeightInput(getHeightFromWidth(nextWidth));
                      }
                      setResized(null);
                    }}
                  />
                  <Input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Height"
                    value={heightInput}
                    onChange={(event) => {
                      const nextHeight = event.target.value;
                      if (isAspectRatioLocked) {
                        setHeightInput(nextHeight);
                        setWidthInput(getWidthFromHeight(nextHeight));
                      } else {
                        setHeightInput(nextHeight);
                      }
                      setResized(null);
                    }}
                    disabled={isAspectRatioLocked}
                  />
                </div>

                <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                  {isAspectRatioLocked
                    ? "Change the width and the height updates automatically to match the original ratio."
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
                        setResized(null);
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
                <Button onClick={resizeImage} disabled={isResizing}>
                  {isResizing ? "Resizing..." : "Resize image"}
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

      <ToolResult title="Preview and download" isProcessing={isResizing} processingLabel="Building resized preview">
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
                <p className="text-sm font-medium text-[var(--muted-foreground)]">Resized result</p>
                {resized ? (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                      imagePreviewBackgroundClassName[outputUsesTransparencyBackground ? "checkerboard" : "white"]
                    }`}
                  >
                    <NextImage
                      src={resized.url}
                      alt="Resized image preview"
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] text-sm text-[var(--muted-foreground)]">
                    {isResizing ? "Building resized image..." : "Resized preview will appear here"}
                  </div>
                )}
              </div>
            </div>

            {resized ? (
              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{resized.fileName}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {resized.width} × {resized.height} · {formatBytes(resized.size)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {file ? getSizeDelta(resized.size, file.size) ?? "Size comparison unavailable" : "Size comparison unavailable"}
                    </p>
                  </div>
                  <Button asChild>
                    <a
                      href={resized.url}
                      download={resized.fileName}
                      onClick={() =>
                        trackEvent("download_result", {
                          tool_slug: "image-resizer",
                          output_format: resized.mimeType,
                          file_name: resized.fileName,
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
            Upload an image to resize it and compare the result here.
          </div>
        )}
      </ToolResult>
    </div>
  );
}
