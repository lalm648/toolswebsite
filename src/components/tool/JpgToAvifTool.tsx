"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function JpgToAvifTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="JPG"
      outputLabel="AVIF"
      accept=".jpg,.jpeg,image/jpeg"
      acceptedMimeTypes={["image/jpeg", "image/jpg"]}
      uploaderDescription="Drop in a JPG, convert it into AVIF in the browser, and download the result without uploading to a server."
      invalidTypeMessage="Please upload a JPG or JPEG image."
      helperText="JPG or JPEG files only"
      outputMimeType="image/avif"
      outputExtension="avif"
      outputQuality={0.62}
      targetMaxSizeRatio={0.55}
      qualityControl={{ min: 35, max: 90, defaultValue: 62 }}
      unsupportedExportMessage="This browser could not export AVIF from canvas. Try a Chromium-based browser or use WebP instead."
    />
  );
}
