"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function PngToWebpTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="PNG"
      outputLabel="WebP"
      accept=".png,image/png"
      acceptedMimeTypes={["image/png"]}
      uploaderDescription="Drop in a PNG, keep transparency intact, and export a WebP file directly in the browser."
      invalidTypeMessage="Please upload a PNG image."
      helperText="PNG files only"
      outputMimeType="image/webp"
      outputExtension="webp"
      outputQuality={0.72}
      targetMaxSizeRatio={0.6}
      qualityControl={{ min: 35, max: 95, defaultValue: 72 }}
      originalPreviewBackground="checkerboard"
      convertedPreviewBackground="checkerboard"
      unsupportedExportMessage="This browser could not export WebP from canvas. Try another browser or format."
    />
  );
}
