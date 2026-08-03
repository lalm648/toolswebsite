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

/**
 * Canvas 2D defaults to `imageSmoothingQuality: "low"`, a cheap bilinear filter that
 * leaves visible aliasing on any downscale. Every export path must go through here.
 */
export function getDrawingContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (context) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
  }

  return context;
}

export type CanvasExportResult = {
  blob: Blob;
  /** The quality the returned blob was actually encoded at, when the format uses one. */
  appliedQuality?: number;
};

// When a browser cannot encode the requested type, canvas.toBlob silently falls back
// to image/png and returns a non-null blob. Reject that so callers can show an
// "unsupported format" message instead of shipping a mislabeled file.
async function encodeExact(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  const blob = await toBlobFromCanvas(canvas, mimeType, quality);

  if (blob && blob.type !== mimeType) {
    return null;
  }

  return blob;
}

export async function exportCanvasAtQuality(
  canvas: HTMLCanvasElement,
  outputMimeType: string,
  outputQuality?: number
): Promise<CanvasExportResult | null> {
  const blob = await encodeExact(canvas, outputMimeType, outputQuality);
  return blob ? { blob, appliedQuality: outputQuality } : null;
}

/**
 * Binary-searches encoder quality for the largest file that still fits `targetBytes`.
 * Returns the closest result it found even when the target is unreachable, so the
 * caller can report the shortfall rather than failing silently.
 */
export async function exportCanvasToTargetSize(
  canvas: HTMLCanvasElement,
  outputMimeType: string,
  targetBytes: number,
  options?: { minQuality?: number; maxQuality?: number; steps?: number }
): Promise<(CanvasExportResult & { withinTarget: boolean }) | null> {
  const minQuality = options?.minQuality ?? 0.3;
  const maxQuality = options?.maxQuality ?? 0.95;
  const steps = options?.steps ?? 7;

  let low = minQuality;
  let high = maxQuality;
  let best: CanvasExportResult | null = null;
  let smallest: CanvasExportResult | null = null;

  for (let step = 0; step < steps; step += 1) {
    const quality = (low + high) / 2;
    const blob = await encodeExact(canvas, outputMimeType, quality);

    if (!blob) {
      return null;
    }

    if (!smallest || blob.size < smallest.blob.size) {
      smallest = { blob, appliedQuality: quality };
    }

    if (blob.size <= targetBytes) {
      // Fits — keep it and try for better quality.
      if (!best || blob.size > best.blob.size) {
        best = { blob, appliedQuality: quality };
      }
      low = quality;
    } else {
      high = quality;
    }
  }

  if (best) {
    return { ...best, withinTarget: true };
  }

  return smallest ? { ...smallest, withinTarget: false } : null;
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

/**
 * Safari caps canvas area well below what desktop Chrome allows; past the limit
 * toBlob returns null or a blank bitmap. Stay under it and tell the caller.
 */
export const MAX_OUTPUT_PIXELS = 40_000_000;

export type ResolvedDimensions = ImageDimensions & {
  /** True when the pixel budget forced the output below the requested size. */
  clamped: boolean;
};

function clampToPixelBudget(width: number, height: number): ResolvedDimensions {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const pixels = safeWidth * safeHeight;

  if (pixels <= MAX_OUTPUT_PIXELS) {
    return { width: safeWidth, height: safeHeight, clamped: false };
  }

  const scale = Math.sqrt(MAX_OUTPUT_PIXELS / pixels);

  // Floor rather than round: rounding both axes up can push the area back over the
  // budget (6325 x 6325 is 40,005,625 against a 40,000,000 ceiling).
  return {
    width: Math.max(1, Math.floor(safeWidth * scale)),
    height: Math.max(1, Math.floor(safeHeight * scale)),
    clamped: true,
  };
}

/**
 * Resolves the pixel size to export at.
 *
 * With `lockAspectRatio` the width and height act as a bounding box and the ratio is
 * preserved. Without it they are used verbatim, which is the whole point of unlocking
 * — the previous behaviour scaled proportionally either way, so asking for 800x800
 * from a 1600x900 source silently produced 800x450.
 */
export function resolveOutputDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  options?: { lockAspectRatio?: boolean; allowUpscale?: boolean }
): ResolvedDimensions {
  const lockAspectRatio = options?.lockAspectRatio ?? true;
  const allowUpscale = options?.allowUpscale ?? false;
  const hasWidth = typeof targetWidth === "number" && targetWidth > 0;
  const hasHeight = typeof targetHeight === "number" && targetHeight > 0;

  if (!hasWidth && !hasHeight) {
    return clampToPixelBudget(sourceWidth, sourceHeight);
  }

  if (!lockAspectRatio) {
    return clampToPixelBudget(
      hasWidth ? (targetWidth as number) : sourceWidth,
      hasHeight ? (targetHeight as number) : sourceHeight
    );
  }

  const widthRatio = hasWidth ? (targetWidth as number) / sourceWidth : Number.POSITIVE_INFINITY;
  const heightRatio = hasHeight ? (targetHeight as number) / sourceHeight : Number.POSITIVE_INFINITY;
  let ratio = Math.min(widthRatio, heightRatio);

  if (!allowUpscale) {
    ratio = Math.min(ratio, 1);
  }

  if (!Number.isFinite(ratio) || ratio <= 0) {
    ratio = 1;
  }

  return clampToPixelBudget(sourceWidth * ratio, sourceHeight * ratio);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
