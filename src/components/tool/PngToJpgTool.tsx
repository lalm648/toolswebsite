"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function PngToJpgTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="PNG"
      outputLabel="JPG"
      accept=".png,image/png"
      acceptedMimeTypes={["image/png"]}
      uploaderDescription="Drop in a PNG, flatten transparency onto white, and export a JPG right inside the browser."
      invalidTypeMessage="Please upload a PNG image."
      helperText="PNG files only"
      outputMimeType="image/jpeg"
      outputExtension="jpg"
      outputQuality={0.86}
      qualityControl={{ min: 45, max: 95, defaultValue: 86 }}
      fillBackgroundColor="#ffffff"
      originalPreviewBackground="checkerboard"
      convertedPreviewBackground="white"
    />
  );
}
