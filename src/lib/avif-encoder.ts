"use client";

import { clamp } from "@/lib/image-conversion";

/**
 * Encodes a canvas to a real AVIF blob using the @jsquash/avif WebAssembly encoder.
 *
 * Browsers cannot encode AVIF via canvas.toBlob (they silently fall back to PNG),
 * so this WASM path is the only way to produce genuine AVIF output client-side.
 * The encoder module is imported dynamically so its ~1MB WASM payload only loads
 * on the AVIF tools, not across the whole app.
 */
export async function encodeCanvasToAvif(
  canvas: HTMLCanvasElement,
  qualityPercent: number
): Promise<Blob> {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable for AVIF encoding.");
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { default: encode } = await import("@jsquash/avif/encode");

  // @jsquash/avif quality is 0-100 (higher = better), matching the UI slider percent.
  const buffer = await encode(imageData, {
    quality: Math.round(clamp(qualityPercent, 1, 100)),
  });

  return new Blob([buffer], { type: "image/avif" });
}
