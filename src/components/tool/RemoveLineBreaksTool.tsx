"use client";

import TextTransformTool from "@/components/tool/TextTransformTool";

function removeLineBreaks(value: string) {
  return value.replace(/\s*\r?\n\s*/g, " ").replace(/[ \t]+/g, " ").trim();
}

export default function RemoveLineBreaksTool() {
  return (
    <TextTransformTool
      title="Remove line breaks"
      description="Join wrapped lines into a single paragraph, ideal for text copied from PDFs or emails."
      outputTitle="Single-line text"
      transform={removeLineBreaks}
    />
  );
}
