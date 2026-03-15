"use client";

import NextImage from "next/image";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import ToolUploader from "@/components/tool/ToolUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type RotatedImage = {
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
  { value: "jpeg", label: "JPG", description: "Good for photos and flat backgrounds." },
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

function normalizeRotation(value: number) {
  return ((value % 360) + 360) % 360;
}

function getRotatedCanvasSize(width: number, height: number, rotation: number) {
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  return {
    width: Math.max(1, Math.round(width * cos + height * sin)),
    height: Math.max(1, Math.round(width * sin + height * cos)),
  };
}

export default function RotateImageTool() {
  const fileInputId = "rotate-image-upload-input";
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [rotated, setRotated] = useState<RotatedImage | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const [rotation, setRotation] = useState(90);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (rotated?.url) URL.revokeObjectURL(rotated.url);
    };
  }, [previewUrl, rotated]);

  function handleSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      trackToolFailure("rotate-image", "select_file", "unsupported_file_type", {
        input_type: selectedFile.type || "unknown",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (rotated?.url) URL.revokeObjectURL(rotated.url);

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
        trackToolFailure("rotate-image", "load_image", "image_load_failed", {
          input_type: selectedFile.type,
          input_size: selectedFile.size,
        });
      });

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setRotated(null);
    setError("");
    setRotation(90);
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

  async function rotateImage() {
    if (!file || !previewUrl) return;

    setIsRotating(true);
    setError("");

    try {
      const image = await loadImageFromUrl(previewUrl);
      const outputConfig = getOutputConfig(outputFormat, file.type);
      const normalizedRotation = normalizeRotation(rotation);
      const { width: targetWidth, height: targetHeight } = getRotatedCanvasSize(
        image.naturalWidth,
        image.naturalHeight,
        normalizedRotation
      );

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Your browser could not start image rotation.");
        setIsRotating(false);
        trackToolFailure("rotate-image", "rotate", "canvas_context_unavailable", {
          input_type: file.type,
          input_size: file.size,
        });
        return;
      }

      if (outputConfig.fillBackgroundColor) {
        context.fillStyle = outputConfig.fillBackgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((normalizedRotation * Math.PI) / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

      const blob = await toBlobFromCanvas(canvas, outputConfig.mimeType, outputConfig.quality);

      if (!blob) {
        setError(`This browser could not export ${outputConfig.label}. Try another format.`);
        setIsRotating(false);
        trackToolFailure("rotate-image", "rotate", "export_failed", {
          input_type: file.type,
          output_format: outputConfig.extension,
          input_size: file.size,
          rotation: normalizedRotation,
        });
        return;
      }

      if (rotated?.url) URL.revokeObjectURL(rotated.url);

      const nextUrl = URL.createObjectURL(blob);
      setRotated({
        url: nextUrl,
        size: blob.size,
        width: targetWidth,
        height: targetHeight,
        fileName: replaceFileExtension(file.name, outputConfig.extension),
        mimeType: outputConfig.mimeType,
      });
      trackEvent("rotate_image", {
        tool_slug: "rotate-image",
        input_type: file.type,
        output_format: outputConfig.extension,
        input_size: file.size,
        output_size: blob.size,
        rotation: normalizedRotation,
      });
      setIsRotating(false);
    } catch {
      setError("This image could not be rotated.");
      setIsRotating(false);
      trackToolFailure("rotate-image", "rotate", "processing_failed", {
        input_type: file.type,
        input_size: file.size,
      });
    }
  }

  function resetTool() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (rotated?.url) URL.revokeObjectURL(rotated.url);
    setFile(null);
    setPreviewUrl("");
    setOriginalDimensions(null);
    setRotated(null);
    setError("");
    setRotation(90);
    setOutputFormat("original");
    if (inputRef.current) inputRef.current.value = "";
  }

  const inputUsesTransparencyBackground = file?.type === "image/png";
  const outputUsesTransparencyBackground = rotated?.mimeType === "image/png" || rotated?.mimeType === "image/webp";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <ToolUploader
          title="Upload image"
          description="Rotate JPG, PNG, or WebP images directly in the browser. Choose the angle, preview the result, and download the rotated image instantly."
          buttonLabel={file ? "Choose another image" : "Upload now"}
          onButtonClick={openPicker}
          fileInputId={fileInputId}
          isProcessing={isRotating}
          processingLabel="Rotating image"
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
                  Ready to rotate
                </Badge>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">Rotation</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Drag to preview the angle live before exporting.
                    </p>
                  </div>
                  <Badge variant="secondary" className="min-w-16 justify-center normal-case tracking-normal">
                    {normalizeRotation(rotation)}°
                  </Badge>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(event) => {
                    setRotation(Number(event.target.value));
                    setRotated(null);
                  }}
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--outline-soft)] accent-[var(--accent-500)]"
                  aria-label="Rotation angle"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                  <span>0°</span>
                  <span>180°</span>
                  <span>360°</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "-90°", delta: -90 },
                    { label: "Reset", delta: "reset" as const },
                    { label: "+90°", delta: 90 },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setRotation((current) =>
                          action.delta === "reset" ? 0 : normalizeRotation(current + action.delta)
                        );
                        setRotated(null);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
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
                        setRotated(null);
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
                <Button onClick={rotateImage} disabled={isRotating}>
                  {isRotating ? "Rotating..." : "Rotate image"}
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

      <ToolResult title="Preview and download" isProcessing={isRotating} processingLabel="Building rotated preview">
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
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  {rotated ? "Rotated result" : "Live rotation preview"}
                </p>
                {rotated ? (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                      imagePreviewBackgroundClassName[outputUsesTransparencyBackground ? "checkerboard" : "white"]
                    }`}
                  >
                    <NextImage
                      src={rotated.url}
                      alt="Rotated image preview"
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] ${
                      inputUsesTransparencyBackground ? imagePreviewBackgroundClassName.checkerboard : "bg-white"
                    }`}
                  >
                    {previewUrl ? (
                      <NextImage
                        src={previewUrl}
                        alt="Live rotated image preview"
                        fill
                        unoptimized
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-contain"
                        style={{ transform: `rotate(${normalizeRotation(rotation)}deg)` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                        {isRotating ? "Building rotated image..." : "Rotated preview will appear here"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {rotated ? (
              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{rotated.fileName}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {rotated.width} × {rotated.height} · {formatBytes(rotated.size)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {file ? getSizeDelta(rotated.size, file.size) ?? "Size comparison unavailable" : "Size comparison unavailable"}
                    </p>
                  </div>
                  <Button asChild>
                    <a
                      href={rotated.url}
                      download={rotated.fileName}
                      onClick={() =>
                        trackEvent("download_result", {
                          tool_slug: "rotate-image",
                          output_format: rotated.mimeType,
                          file_name: rotated.fileName,
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
            Upload an image to rotate it and compare the result here.
          </div>
        )}
      </ToolResult>
    </div>
  );
}
