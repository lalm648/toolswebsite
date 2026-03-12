"use client";

import NextImage from "next/image";
import type { DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import ToolResult from "@/components/tool/ToolResult";
import ToolUploader from "@/components/tool/ToolUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  exportCanvasWithStrategy,
  formatBytes,
  getSizeDelta,
  imagePreviewBackgroundClassName,
  loadImageFromUrl,
  replaceFileExtension,
  type ImageDimensions,
} from "@/lib/image-conversion";

type ConvertedImage = {
  url: string;
  size: number;
  width: number;
  height: number;
  fileName: string;
};

type PreviewBackground = "plain" | "white" | "checkerboard";

type ImageFormatConverterToolProps = {
  inputLabel: string;
  outputLabel: string;
  accept: string;
  acceptedMimeTypes: string[];
  uploaderDescription: string;
  invalidTypeMessage: string;
  helperText: string;
  outputMimeType: string;
  outputExtension: string;
  outputQuality?: number;
  outputQualityCandidates?: number[];
  targetMaxSizeRatio?: number;
  qualityControl?: {
    min: number;
    max: number;
    step?: number;
    defaultValue: number;
  };
  qualityNote?: {
    label: string;
    description: string;
    value: string;
    sliderValue?: number;
    sliderMin?: number;
    sliderMax?: number;
  };
  sizeDeltaText?: (convertedSize: number, originalSize: number) => string | null;
  fillBackgroundColor?: string;
  originalPreviewBackground?: PreviewBackground;
  convertedPreviewBackground?: PreviewBackground;
  unsupportedExportMessage?: string;
};

export default function ImageFormatConverterTool({
  inputLabel,
  outputLabel,
  accept,
  acceptedMimeTypes,
  uploaderDescription,
  invalidTypeMessage,
  helperText,
  outputMimeType,
  outputExtension,
  outputQuality,
  outputQualityCandidates,
  targetMaxSizeRatio,
  qualityControl,
  qualityNote,
  sizeDeltaText,
  fillBackgroundColor,
  originalPreviewBackground = "plain",
  convertedPreviewBackground = "plain",
  unsupportedExportMessage,
}: ImageFormatConverterToolProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState("");
  const [qualityPercent, setQualityPercent] = useState(qualityControl?.defaultValue ?? 82);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (converted?.url) URL.revokeObjectURL(converted.url);
    };
  }, [previewUrl, converted]);

  function handleSelect(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!acceptedMimeTypes.includes(selectedFile.type)) {
      setError(invalidTypeMessage);
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
      });

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    setConverted(null);
    setError("");
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

  async function convert() {
    if (!file || !previewUrl) return;

    setIsConverting(true);
    setError("");

    try {
      const image = await loadImageFromUrl(previewUrl);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Your browser could not start image conversion.");
        setIsConverting(false);
        return;
      }

      if (fillBackgroundColor) {
        context.fillStyle = fillBackgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0);

      const selectedQuality = qualityControl ? qualityPercent / 100 : outputQuality;
      const selectedQualityCandidates =
        qualityControl && targetMaxSizeRatio
          ? Array.from(
              new Set(
                [qualityPercent, qualityPercent - 8, qualityPercent - 16, qualityPercent - 24]
                  .filter((value) => value >= qualityControl.min)
                  .map((value) => Number((value / 100).toFixed(2)))
              )
            )
          : outputQualityCandidates;

      const blob = await exportCanvasWithStrategy(canvas, {
        outputMimeType,
        outputQuality: selectedQuality,
        qualityCandidates: selectedQualityCandidates,
        targetMaxSizeRatio,
        originalSize: file.size,
      });

      if (!blob) {
        setError(
          unsupportedExportMessage ?? `This browser could not export ${outputLabel}. Try another browser or format.`
        );
        setIsConverting(false);
        return;
      }

      if (converted?.url) URL.revokeObjectURL(converted.url);

      const nextConvertedUrl = URL.createObjectURL(blob);
      setConverted({
        url: nextConvertedUrl,
        size: blob.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
        fileName: replaceFileExtension(file.name, outputExtension),
      });
      setIsConverting(false);
    } catch {
      setError("This image could not be processed.");
      setIsConverting(false);
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
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <ToolUploader
          title={`Upload ${inputLabel} image`}
          description={uploaderDescription}
          buttonLabel={file ? `Choose another ${inputLabel}` : "Upload now"}
          onButtonClick={openPicker}
          dropHint={`or drag and drop a ${inputLabel} here`}
          isDragActive={isDragActive}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          helperText={helperText}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
          />

          {file ? (
            <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink-900)]">{file.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                </div>
                <Badge variant="secondary" className="normal-case tracking-normal text-[11px] font-medium">
                  Ready to convert
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={convert} disabled={isConverting}>
                  {isConverting ? "Converting..." : `Convert to ${outputLabel}`}
                </Button>
                <Button variant="secondary" onClick={resetTool}>
                  Reset
                </Button>
              </div>

              {qualityControl || qualityNote ? (
                <div className="mt-5 rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-panel)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink-900)]">
                        {qualityNote?.label ?? "Quality"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {qualityNote?.description ?? "Lower quality usually means a smaller file size."}
                      </p>
                    </div>
                    <Badge variant="secondary" className="min-w-16 justify-center normal-case tracking-normal">
                      {qualityNote?.value ?? `${qualityPercent}%`}
                    </Badge>
                  </div>
                  {qualityControl ? (
                    <>
                      <input
                        type="range"
                        min={qualityControl.min}
                        max={qualityControl.max}
                        step={qualityControl.step ?? 1}
                        value={qualityPercent}
                        onChange={(event) => {
                          setQualityPercent(Number(event.target.value));
                          setConverted(null);
                        }}
                        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--outline-soft)] accent-[var(--accent-500)]"
                        aria-label={`${outputLabel} quality`}
                      />
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                        <span>{qualityControl.min}%</span>
                        <span>{qualityControl.max}%</span>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[var(--brand-600)]">{error}</p> : null}
        </ToolUploader>
      </div>

      <ToolResult title="Preview and download">
        {previewUrl ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{`Original ${inputLabel}`}</p>
                <div
                  className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${imagePreviewBackgroundClassName[originalPreviewBackground]}`}
                >
                  <NextImage
                    src={previewUrl}
                    alt={`Original ${inputLabel} preview`}
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {originalDimensions ? (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    {originalDimensions.width} × {originalDimensions.height}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] p-4">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{`Converted ${outputLabel}`}</p>
                {converted ? (
                  <div
                    className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${imagePreviewBackgroundClassName[convertedPreviewBackground]}`}
                  >
                    <NextImage
                      src={converted.url}
                      alt={`Converted ${outputLabel} preview`}
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex aspect-square items-center justify-center rounded-xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] text-sm text-[var(--muted-foreground)]">
                    {isConverting ? `Building ${outputLabel}...` : `${outputLabel} preview will appear here`}
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
                    {(() => {
                      const deltaText = file
                        ? sizeDeltaText?.(converted.size, file.size) ?? getSizeDelta(converted.size, file.size)
                        : null;

                      return deltaText ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{deltaText}</p>
                      ) : null;
                    })()}
                  </div>
                  <Button asChild>
                    <a href={converted.url} download={converted.fileName}>
                      {`Download ${outputLabel}`}
                    </a>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-[var(--outline-soft)] bg-[var(--surface-panel)] text-center text-sm text-[var(--muted-foreground)]">
            {`Upload a ${inputLabel} to preview, convert, and download it here.`}
          </div>
        )}
      </ToolResult>
    </div>
  );
}
