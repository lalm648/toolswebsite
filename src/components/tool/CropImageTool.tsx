"use client";

import NextImage from "next/image";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import ToolUploader from "@/components/tool/ToolUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackEvent, trackToolFailure } from "@/lib/analytics";
import {
  clamp,
  formatBytes,
  getSizeDelta,
  imagePreviewBackgroundClassName,
  loadImageFromUrl,
  replaceFileExtension,
  toBlobFromCanvas,
  type ImageDimensions,
} from "@/lib/image-conversion";

type OutputFormat = "original" | "jpeg" | "png" | "webp";
type AspectPreset = "free" | "square" | "4:3" | "16:9";

type CroppedImage = {
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

const aspectPresets: { value: AspectPreset; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "square", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
];

function getFormatFromMimeType(mimeType: string): Exclude<OutputFormat, "original"> {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
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

function getAspectRatio(preset: AspectPreset) {
  switch (preset) {
    case "square":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    default:
      return null;
  }
}

function getPreviewGeometry(
  frameElement: HTMLDivElement | null,
  originalDimensions: ImageDimensions | null
) {
  if (!frameElement || !originalDimensions) {
    return null;
  }

  const rect = frameElement.getBoundingClientRect();
  const frameSize = Math.min(rect.width, rect.height);
  const imageRatio = originalDimensions.width / originalDimensions.height;

  let width = frameSize;
  let height = frameSize;
  let left = rect.left;
  let top = rect.top;
  let offsetLeft = 0;
  let offsetTop = 0;

  if (imageRatio > 1) {
    height = frameSize / imageRatio;
    top = rect.top + (frameSize - height) / 2;
    offsetTop = (frameSize - height) / 2;
  } else {
    width = frameSize * imageRatio;
    left = rect.left + (frameSize - width) / 2;
    offsetLeft = (frameSize - width) / 2;
  }

  return { left, top, width, height, offsetLeft, offsetTop };
}

export default function CropImageTool() {
  const fileInputId = "crop-image-upload-input";
  const inputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<
    | {
        mode: "move" | "resize-left" | "resize-right" | "resize-top" | "resize-bottom";
        startPointerX: number;
        startPointerY: number;
        startCropX: number;
        startCropY: number;
        startCropWidth: number;
        startCropHeight: number;
      }
    | null
  >(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [cropped, setCropped] = useState<CroppedImage | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);
  const [previewGeometry, setPreviewGeometry] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    offsetLeft: number;
    offsetTop: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (cropped?.url) URL.revokeObjectURL(cropped.url);
    };
  }, [previewUrl, cropped]);

  useEffect(() => {
    function updatePreviewGeometry() {
      setPreviewGeometry(getPreviewGeometry(previewFrameRef.current, originalDimensions));
    }

    updatePreviewGeometry();
    window.addEventListener("resize", updatePreviewGeometry);

    return () => {
      window.removeEventListener("resize", updatePreviewGeometry);
    };
  }, [originalDimensions]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!dragStateRef.current || !originalDimensions) {
        return;
      }

      const geometry = previewGeometry;

      if (!geometry) {
        return;
      }

      const pointerDeltaX =
        ((event.clientX - dragStateRef.current.startPointerX) / geometry.width) * originalDimensions.width;
      const pointerDeltaY =
        ((event.clientY - dragStateRef.current.startPointerY) / geometry.height) * originalDimensions.height;

      if (dragStateRef.current.mode === "move") {
        const nextX = clamp(
          Math.round(dragStateRef.current.startCropX + pointerDeltaX),
          0,
          originalDimensions.width - dragStateRef.current.startCropWidth
        );
        const nextY = clamp(
          Math.round(dragStateRef.current.startCropY + pointerDeltaY),
          0,
          originalDimensions.height - dragStateRef.current.startCropHeight
        );

        setCropX(nextX);
        setCropY(nextY);
        setCropped(null);
        return;
      }

      if (dragStateRef.current.mode === "resize-left") {
        const nextX = clamp(
          Math.round(dragStateRef.current.startCropX + pointerDeltaX),
          0,
          dragStateRef.current.startCropX + dragStateRef.current.startCropWidth - 1
        );

        setCropX(nextX);
        setCropWidth(dragStateRef.current.startCropWidth + dragStateRef.current.startCropX - nextX);
        setCropped(null);
        return;
      }

      if (dragStateRef.current.mode === "resize-right") {
        setCropWidth(
          clamp(
            Math.round(dragStateRef.current.startCropWidth + pointerDeltaX),
            1,
            originalDimensions.width - dragStateRef.current.startCropX
          )
        );
        setCropped(null);
        return;
      }

      if (dragStateRef.current.mode === "resize-top") {
        const nextY = clamp(
          Math.round(dragStateRef.current.startCropY + pointerDeltaY),
          0,
          dragStateRef.current.startCropY + dragStateRef.current.startCropHeight - 1
        );

        setCropY(nextY);
        setCropHeight(dragStateRef.current.startCropHeight + dragStateRef.current.startCropY - nextY);
        setCropped(null);
        return;
      }

      if (dragStateRef.current.mode === "resize-bottom") {
        setCropHeight(
          clamp(
            Math.round(dragStateRef.current.startCropHeight + pointerDeltaY),
            1,
            originalDimensions.height - dragStateRef.current.startCropY
          )
        );
      }

      setCropped(null);
    }

    function handlePointerUp() {
      dragStateRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [cropHeight, cropWidth, originalDimensions, previewGeometry]);

  function initializeCrop(dimensions: ImageDimensions) {
    setCropX(0);
    setCropY(0);
    setCropWidth(dimensions.width);
    setCropHeight(dimensions.height);
  }

  function handleSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      trackToolFailure("crop-image", "select_file", "unsupported_file_type", {
        input_type: selectedFile.type || "unknown",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (cropped?.url) URL.revokeObjectURL(cropped.url);

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setOriginalDimensions(null);

    void loadImageFromUrl(nextPreviewUrl)
      .then((image) => {
        const dimensions = { width: image.naturalWidth, height: image.naturalHeight };
        setOriginalDimensions(dimensions);
        initializeCrop(dimensions);
      })
      .catch(() => {
        setError("This image could not be processed.");
        trackToolFailure("crop-image", "load_image", "image_load_failed", {
          input_type: selectedFile.type,
          input_size: selectedFile.size,
        });
      });

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setCropped(null);
    setError("");
    setOutputFormat("original");
    setAspectPreset("free");
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

  function setPreset(nextPreset: AspectPreset) {
    if (!originalDimensions) return;

    setAspectPreset(nextPreset);
    setCropped(null);

    if (nextPreset === "free") {
      return;
    }

    const ratio = getAspectRatio(nextPreset);
    if (!ratio) return;

    let nextWidth = originalDimensions.width;
    let nextHeight = Math.round(nextWidth / ratio);

    if (nextHeight > originalDimensions.height) {
      nextHeight = originalDimensions.height;
      nextWidth = Math.round(nextHeight * ratio);
    }

    setCropWidth(nextWidth);
    setCropHeight(nextHeight);
    setCropX(0);
    setCropY(0);
  }

  function centerCrop() {
    if (!originalDimensions) return;

    setCropX(Math.max(0, Math.round((originalDimensions.width - cropWidth) / 2)));
    setCropY(Math.max(0, Math.round((originalDimensions.height - cropHeight) / 2)));
    setCropped(null);
  }

  function resetFullImage() {
    if (!originalDimensions) return;

    initializeCrop(originalDimensions);
    setAspectPreset("free");
    setCropped(null);
  }

  function updateCropWidth(nextWidth: number) {
    if (!originalDimensions) return;

    const maxWidth = originalDimensions.width - cropX;
    const clampedWidth = clamp(nextWidth, 1, maxWidth);
    const ratio = getAspectRatio(aspectPreset);

    if (!ratio) {
      setCropWidth(clampedWidth);
      if (cropY + cropHeight > originalDimensions.height) {
        setCropHeight(originalDimensions.height - cropY);
      }
      return;
    }

    let nextHeight = Math.round(clampedWidth / ratio);

    if (cropY + nextHeight > originalDimensions.height) {
      nextHeight = originalDimensions.height - cropY;
      const fallbackWidth = clamp(Math.round(nextHeight * ratio), 1, maxWidth);
      setCropWidth(fallbackWidth);
      setCropHeight(nextHeight);
      return;
    }

    setCropWidth(clampedWidth);
    setCropHeight(nextHeight);
  }

  function updateCropHeight(nextHeight: number) {
    if (!originalDimensions) return;

    const maxHeight = originalDimensions.height - cropY;
    const clampedHeight = clamp(nextHeight, 1, maxHeight);
    const ratio = getAspectRatio(aspectPreset);

    if (!ratio) {
      setCropHeight(clampedHeight);
      if (cropX + cropWidth > originalDimensions.width) {
        setCropWidth(originalDimensions.width - cropX);
      }
      return;
    }

    let nextWidth = Math.round(clampedHeight * ratio);

    if (cropX + nextWidth > originalDimensions.width) {
      nextWidth = originalDimensions.width - cropX;
      const fallbackHeight = clamp(Math.round(nextWidth / ratio), 1, maxHeight);
      setCropWidth(nextWidth);
      setCropHeight(fallbackHeight);
      return;
    }

    setCropWidth(nextWidth);
    setCropHeight(clampedHeight);
  }

  function handleCropDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (!originalDimensions) {
      return;
    }

    const geometry = previewGeometry;

    if (!geometry) {
      return;
    }

    dragStateRef.current = {
      mode: "move",
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startCropX: cropX,
      startCropY: cropY,
      startCropWidth: cropWidth,
      startCropHeight: cropHeight,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCropResizeStart(
    mode: "resize-left" | "resize-right" | "resize-top" | "resize-bottom",
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    event.stopPropagation();

    dragStateRef.current = {
      mode,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startCropX: cropX,
      startCropY: cropY,
      startCropWidth: cropWidth,
      startCropHeight: cropHeight,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function cropImage() {
    if (!file || !previewUrl || !originalDimensions) return;

    setIsCropping(true);
    setError("");

    try {
      const image = await loadImageFromUrl(previewUrl);
      const outputConfig = getOutputConfig(outputFormat, file.type);

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Your browser could not start image cropping.");
        setIsCropping(false);
        trackToolFailure("crop-image", "crop", "canvas_context_unavailable", {
          input_type: file.type,
          input_size: file.size,
        });
        return;
      }

      if (outputConfig.fillBackgroundColor) {
        context.fillStyle = outputConfig.fillBackgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const blob = await toBlobFromCanvas(canvas, outputConfig.mimeType, outputConfig.quality);

      if (!blob) {
        setError(`This browser could not export ${outputConfig.label}. Try another format.`);
        setIsCropping(false);
        trackToolFailure("crop-image", "crop", "export_failed", {
          input_type: file.type,
          output_format: outputConfig.extension,
          input_size: file.size,
          crop_width: cropWidth,
          crop_height: cropHeight,
          aspect_preset: aspectPreset,
        });
        return;
      }

      if (cropped?.url) URL.revokeObjectURL(cropped.url);

      const nextUrl = URL.createObjectURL(blob);
      setCropped({
        url: nextUrl,
        size: blob.size,
        width: cropWidth,
        height: cropHeight,
        fileName: replaceFileExtension(file.name, outputConfig.extension),
        mimeType: outputConfig.mimeType,
      });
      trackEvent("crop_image", {
        tool_slug: "crop-image",
        input_type: file.type,
        output_format: outputConfig.extension,
        input_size: file.size,
        output_size: blob.size,
        crop_width: cropWidth,
        crop_height: cropHeight,
        crop_x: cropX,
        crop_y: cropY,
        aspect_preset: aspectPreset,
      });
      setIsCropping(false);
    } catch {
      setError("This image could not be cropped.");
      setIsCropping(false);
      trackToolFailure("crop-image", "crop", "processing_failed", {
        input_type: file.type,
        input_size: file.size,
        crop_width: cropWidth,
        crop_height: cropHeight,
        aspect_preset: aspectPreset,
      });
    }
  }

  function resetTool() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (cropped?.url) URL.revokeObjectURL(cropped.url);
    setFile(null);
    setPreviewUrl("");
    setOriginalDimensions(null);
    setCropped(null);
    setError("");
    setOutputFormat("original");
    setAspectPreset("free");
    setCropX(0);
    setCropY(0);
    setCropWidth(100);
    setCropHeight(100);
    if (inputRef.current) inputRef.current.value = "";
  }

  const usesTransparencyBackground = file?.type === "image/png";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <ToolUploader
          title="Upload image"
          description="Crop JPG, PNG, or WebP images directly in the browser. Pick the crop area, preview the result, and download the cropped image instantly."
          buttonLabel={file ? "Choose another image" : "Upload now"}
          onButtonClick={openPicker}
          fileInputId={fileInputId}
          isProcessing={isCropping}
          processingLabel="Cropping image"
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
            <div className="rounded-2xl border border-(--outline-soft) bg-(--surface-raised) p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-(--ink-900)">{file.name}</p>
                  <p className="mt-1 text-xs text-(--muted-foreground)">
                    {formatBytes(file.size)}
                    {originalDimensions ? ` · ${originalDimensions.width} × ${originalDimensions.height}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
                  Ready to crop
                </Badge>
              </div>

              <div className="mt-5 rounded-2xl border border-(--outline-soft) bg-(--surface-panel) p-4">
                <p className="text-sm font-semibold text-(--ink-900)">Aspect preset</p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {aspectPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPreset(preset.value)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-medium shadow-(--shadow-soft) ${
                        aspectPreset === preset.value
                          ? "border-(--accent-500) bg-(--accent-50) text-(--accent-700)"
                          : "border-(--outline-soft) bg-(--surface-raised) text-(--ink-900)"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {originalDimensions ? (
                <div className="mt-4 rounded-2xl border border-(--outline-soft) bg-(--surface-panel) p-4">
                  <p className="text-sm font-semibold text-(--ink-900)">Crop area</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="secondary" onClick={centerCrop}>
                      Center crop
                    </Button>
                    <Button type="button" variant="secondary" onClick={resetFullImage}>
                      Use full image
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-(--muted-foreground)">
                      X
                      <input
                        type="number"
                        min={0}
                        max={Math.max(0, originalDimensions.width - cropWidth)}
                        value={cropX}
                        onChange={(event) => {
                          setCropX(
                            clamp(
                              Number(event.target.value) || 0,
                              0,
                              Math.max(0, originalDimensions.width - cropWidth)
                            )
                          );
                          setCropped(null);
                        }}
                        className="mt-2 flex h-11 w-full rounded-2xl border border-(--outline-soft) bg-(--surface-raised) px-4 py-3 text-sm text-(--ink-900) outline-none"
                      />
                    </label>
                    <label className="text-xs text-(--muted-foreground)">
                      Y
                      <input
                        type="number"
                        min={0}
                        max={Math.max(0, originalDimensions.height - cropHeight)}
                        value={cropY}
                        onChange={(event) => {
                          setCropY(
                            clamp(
                              Number(event.target.value) || 0,
                              0,
                              Math.max(0, originalDimensions.height - cropHeight)
                            )
                          );
                          setCropped(null);
                        }}
                        className="mt-2 flex h-11 w-full rounded-2xl border border-(--outline-soft) bg-(--surface-raised) px-4 py-3 text-sm text-(--ink-900) outline-none"
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                        <span>Left</span>
                        <span>{cropX}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, originalDimensions.width - cropWidth)}
                        value={cropX}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setCropX(next);
                          setCropped(null);
                        }}
                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-(--outline-soft) accent-(--accent-500)"
                        aria-label="Crop left"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                        <span>Top</span>
                        <span>{cropY}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, originalDimensions.height - cropHeight)}
                        value={cropY}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setCropY(next);
                          setCropped(null);
                        }}
                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-(--outline-soft) accent-(--accent-500)"
                        aria-label="Crop top"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                        <span>Width</span>
                        <span>{cropWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, originalDimensions.width - cropX)}
                        value={cropWidth}
                        onChange={(event) => {
                          updateCropWidth(Number(event.target.value));
                          setCropped(null);
                        }}
                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-(--outline-soft) accent-(--accent-500)"
                        aria-label="Crop width"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                        <span>Height</span>
                        <span>{cropHeight}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, originalDimensions.height - cropY)}
                        value={cropHeight}
                        onChange={(event) => {
                          updateCropHeight(Number(event.target.value));
                          setCropped(null);
                        }}
                        disabled={aspectPreset !== "free"}
                        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-(--outline-soft) accent-(--accent-500) disabled:cursor-not-allowed"
                        aria-label="Crop height"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-(--muted-foreground)">
                    {aspectPreset === "free"
                      ? "Adjust width and height freely."
                      : "Height follows the selected aspect ratio preset."}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-(--outline-soft) bg-(--surface-panel) p-4">
                <p className="text-sm font-semibold text-(--ink-900)">Output format</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {outputOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setOutputFormat(option.value);
                        setCropped(null);
                      }}
                      className={`rounded-2xl border p-3 text-left shadow-(--shadow-soft) ${
                        outputFormat === option.value
                          ? "border-(--accent-500) bg-(--accent-50)"
                          : "border-(--outline-soft) bg-(--surface-raised)"
                      }`}
                    >
                      <p className="text-sm font-semibold text-(--ink-900)">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-(--muted-foreground)">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={cropImage} disabled={isCropping}>
                  {isCropping ? "Cropping..." : "Crop image"}
                </Button>
                <Button variant="secondary" onClick={resetTool}>
                  Reset
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-(--brand-600)">{error}</p> : null}
        </ToolUploader>
      </div>

      <ToolResult title="Preview and download" isProcessing={isCropping} processingLabel="Building cropped preview">
        {previewUrl && originalDimensions ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--outline-soft) bg-(--surface-raised) p-4">
                <p className="text-sm font-medium text-(--muted-foreground)">Crop frame</p>
                <div
                  ref={previewFrameRef}
                  className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                    imagePreviewBackgroundClassName[usesTransparencyBackground ? "checkerboard" : "plain"]
                  }`}
                >
                  <NextImage
                    src={previewUrl}
                    alt="Original crop source preview"
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  {previewGeometry ? (
                    <div
                      role="presentation"
                      onPointerDown={handleCropDragStart}
                      className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]"
                      style={{
                        left: previewGeometry.offsetLeft + (cropX / originalDimensions.width) * previewGeometry.width,
                        top: previewGeometry.offsetTop + (cropY / originalDimensions.height) * previewGeometry.height,
                        width: (cropWidth / originalDimensions.width) * previewGeometry.width,
                        height: (cropHeight / originalDimensions.height) * previewGeometry.height,
                      }}
                    >
                      <div className="absolute inset-0 border border-white/40" />
                      <div className="pointer-events-none absolute left-1/3 top-0 h-full border-l border-white/35" />
                      <div className="pointer-events-none absolute left-2/3 top-0 h-full border-l border-white/35" />
                      <div className="pointer-events-none absolute top-1/3 left-0 w-full border-t border-white/35" />
                      <div className="pointer-events-none absolute top-2/3 left-0 w-full border-t border-white/35" />
                      {aspectPreset === "free" ? (
                        <>
                          <div
                            onPointerDown={(event) => handleCropResizeStart("resize-left", event)}
                            className="absolute bottom-3 left-0 top-3 -ml-2 w-4 cursor-ew-resize rounded-full border border-white/70 bg-white/85 shadow-(--shadow-soft)"
                            aria-hidden="true"
                          />
                          <div
                            onPointerDown={(event) => handleCropResizeStart("resize-right", event)}
                            className="absolute bottom-3 right-0 top-3 -mr-2 w-4 cursor-ew-resize rounded-full border border-white/70 bg-white/85 shadow-(--shadow-soft)"
                            aria-hidden="true"
                          />
                          <div
                            onPointerDown={(event) => handleCropResizeStart("resize-top", event)}
                            className="absolute left-3 right-3 top-0 -mt-2 h-4 cursor-ns-resize rounded-full border border-white/70 bg-white/85 shadow-(--shadow-soft)"
                            aria-hidden="true"
                          />
                          <div
                            onPointerDown={(event) => handleCropResizeStart("resize-bottom", event)}
                            className="absolute bottom-0 left-3 right-3 -mb-2 h-4 cursor-ns-resize rounded-full border border-white/70 bg-white/85 shadow-(--shadow-soft)"
                            aria-hidden="true"
                          />
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-(--outline-soft) bg-(--surface-raised) p-4">
                <p className="text-sm font-medium text-(--muted-foreground)">
                  {cropped ? "Cropped result" : "Live crop preview"}
                </p>
                {cropped ? (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                      imagePreviewBackgroundClassName[
                        cropped.mimeType === "png" || cropped.mimeType === "image/webp" ? "checkerboard" : "white"
                      ]
                    }`}
                  >
                    <NextImage
                      src={cropped.url}
                      alt="Cropped image preview"
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${
                      imagePreviewBackgroundClassName[usesTransparencyBackground ? "checkerboard" : "plain"]
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                      <div
                        className="relative max-h-full w-full overflow-hidden rounded-lg"
                        style={{
                          aspectRatio: `${cropWidth} / ${Math.max(1, cropHeight)}`,
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${previewUrl})`,
                            backgroundSize: `${(originalDimensions.width / cropWidth) * 100}% ${(originalDimensions.height / cropHeight) * 100}%`,
                            backgroundPosition: `${(cropX / Math.max(1, originalDimensions.width - cropWidth)) * 100 || 0}% ${
                              (cropY / Math.max(1, originalDimensions.height - cropHeight)) * 100 || 0
                            }%`,
                            backgroundRepeat: "no-repeat",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {cropped ? (
              <div className="rounded-2xl border border-(--outline-soft) bg-(--surface-raised) p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-(--ink-900)">{cropped.fileName}</p>
                    <p className="mt-1 text-sm text-(--muted-foreground)">
                      {cropped.width} × {cropped.height} · {formatBytes(cropped.size)}
                    </p>
                    <p className="mt-1 text-xs text-(--muted-foreground)">
                      {file ? getSizeDelta(cropped.size, file.size) ?? "Size comparison unavailable" : "Size comparison unavailable"}
                    </p>
                  </div>
                  <Button asChild>
                    <a
                      href={cropped.url}
                      download={cropped.fileName}
                      onClick={() =>
                        trackEvent("download_result", {
                          tool_slug: "crop-image",
                          output_format: cropped.mimeType,
                          file_name: cropped.fileName,
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
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-(--outline-soft) bg-(--surface-panel) text-center text-sm text-(--muted-foreground)">
            Upload an image to crop it and preview the result here.
          </div>
        )}
      </ToolResult>
    </div>
  );
}
