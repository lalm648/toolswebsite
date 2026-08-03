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
      qualityControl={{ min: 35, max: 90, defaultValue: 62 }}
      unsupportedExportMessage="AVIF encoding failed. This usually means the encoder could not load — check your connection and retry, or use WebP instead."
    />
  );
}
