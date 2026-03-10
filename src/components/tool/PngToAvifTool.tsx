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
      outputQuality={0.9}
      originalPreviewBackground="checkerboard"
      convertedPreviewBackground="checkerboard"
      unsupportedExportMessage="This browser could not export AVIF from canvas. Try a Chromium-based browser or use WebP instead."
    />
  );
}
