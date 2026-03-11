"use client";

import ImageFormatConverterTool from "@/components/tool/ImageFormatConverterTool";

export default function JpgToPngTool() {
  return (
    <ImageFormatConverterTool
      inputLabel="JPG"
      outputLabel="PNG"
      accept=".jpg,.jpeg,image/jpeg"
      acceptedMimeTypes={["image/jpeg", "image/jpg"]}
      uploaderDescription="Drop in a JPG, convert it inside the browser, and download the PNG instantly. No server upload needed."
      invalidTypeMessage="Please upload a JPG or JPEG image."
      helperText="JPG or JPEG files only"
      outputMimeType="image/png"
      outputExtension="png"
      outputQuality={1}
      qualityNote={{
        label: "Output mode",
        description: "PNG export is lossless, so it preserves image detail and does not use a quality slider.",
        value: "Lossless",
      }}
      sizeDeltaText={(convertedSize, originalSize) =>
        convertedSize > originalSize
          ? "PNG is lossless, so files can be larger than the original JPG."
          : "PNG stayed smaller than the original JPG."
      }
    />
  );
}
