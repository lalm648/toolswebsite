"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function PngToAvifTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="PNG"
      outputLabel="AVIF"
      accept=".png,image/png"
      acceptedMimeTypes={["image/png"]}
      uploaderDescription="Drop in a PNG, preserve transparency when supported, and export an AVIF file in the browser."
      invalidTypeMessage="Please upload a PNG image."
      helperText="PNG files only"
      outputMimeType="image/avif"
      outputExtension="avif"
      outputQuality={0.58}
      qualityControl={{ min: 30, max: 90, defaultValue: 58 }}
      originalPreviewBackground="checkerboard"
      convertedPreviewBackground="checkerboard"
      unsupportedExportMessage="AVIF encoding failed. This usually means the encoder could not load — check your connection and retry, or use WebP instead."
    />
  );
}
