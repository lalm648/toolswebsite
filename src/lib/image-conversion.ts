"use client";

export type ImageDimensions = {
  width: number;
  height: number;
};

export const imagePreviewBackgroundClassName = {
  plain: "",
  white: "bg-white",
  checkerboard:
    "bg-[linear-gradient(45deg,rgba(226,232,240,0.7)_25%,transparent_25%,transparent_75%,rgba(226,232,240,0.7)_75%),linear-gradient(45deg,rgba(226,232,240,0.7)_25%,transparent_25%,transparent_75%,rgba(226,232,240,0.7)_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]",
} as const;

export function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function replaceFileExtension(fileName: string, nextExtension: string) {
  const nameWithoutExtension = fileName.replace(/\.[^.]+$/, "");
  return `${nameWithoutExtension}.${nextExtension}`;
}

export function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = url;
  });
}

export function toBlobFromCanvas(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

type ExportStrategyOptions = {
  outputMimeType: string;
  outputQuality?: number;
  qualityCandidates?: number[];
  targetMaxSizeRatio?: number;
  originalSize: number;
};

export async function exportCanvasWithStrategy(
  canvas: HTMLCanvasElement,
  { outputMimeType, outputQuality, qualityCandidates, targetMaxSizeRatio, originalSize }: ExportStrategyOptions
) {
  if (!qualityCandidates?.length) {
    return toBlobFromCanvas(canvas, outputMimeType, outputQuality);
  }

  let smallestBlob: Blob | null = null;

  for (const quality of qualityCandidates) {
    const blob = await toBlobFromCanvas(canvas, outputMimeType, quality);

    if (!blob) {
      continue;
    }

    if (!smallestBlob || blob.size < smallestBlob.size) {
      smallestBlob = blob;
    }

    if (targetMaxSizeRatio && blob.size <= originalSize * targetMaxSizeRatio) {
      return blob;
    }
  }

  return smallestBlob;
}

export function getSizeDelta(copySize: number, originalSize: number) {
  if (!originalSize) {
    return null;
  }

  const ratio = copySize / originalSize;
  const percentage = Math.abs((1 - ratio) * 100);

  if (ratio === 1) {
    return "Same file size";
  }

  if (ratio < 1) {
    return `${percentage.toFixed(0)}% smaller than original`;
  }

  return `${percentage.toFixed(0)}% larger than original`;
}

export function scaleDimensionsToFit(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
) {
  if (!maxWidth && !maxHeight) {
    return { width, height };
  }

  const widthLimit = maxWidth && maxWidth > 0 ? maxWidth / width : 1;
  const heightLimit = maxHeight && maxHeight > 0 ? maxHeight / height : 1;
  const ratio = Math.min(widthLimit, heightLimit, 1);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
