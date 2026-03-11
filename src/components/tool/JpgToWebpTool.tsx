"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function JpgToWebpTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="JPG"
      outputLabel="WebP"
      accept=".jpg,.jpeg,image/jpeg"
      acceptedMimeTypes={["image/jpeg", "image/jpg"]}
      uploaderDescription="Drop in a JPG, convert it into modern WebP format in the browser, and download it instantly."
      invalidTypeMessage="Please upload a JPG or JPEG image."
      helperText="JPG or JPEG files only"
      outputMimeType="image/webp"
      outputExtension="webp"
      outputQuality={0.76}
      targetMaxSizeRatio={0.6}
      qualityControl={{ min: 40, max: 95, defaultValue: 76 }}
      unsupportedExportMessage="This browser could not export WebP from canvas. Try another browser or format."
    />
  );
}
