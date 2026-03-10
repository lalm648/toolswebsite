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
