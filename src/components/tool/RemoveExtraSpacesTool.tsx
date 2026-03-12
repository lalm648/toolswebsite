"use client";

import TextTransformTool from "@/components/tool/TextTransformTool";

function removeExtraSpaces(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

export default function RemoveExtraSpacesTool() {
  return (
    <TextTransformTool
      title="Remove extra spaces"
      description="Clean text copied from PDFs, docs, emails, or websites by collapsing repeated spaces and tabs."
      outputTitle="Cleaned text"
      transform={removeExtraSpaces}
    />
  );
}
