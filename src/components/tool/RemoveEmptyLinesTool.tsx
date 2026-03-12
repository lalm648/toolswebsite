"use client";

import TextTransformTool from "@/components/tool/TextTransformTool";

function removeEmptyLines(value: string) {
  return value
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

export default function RemoveEmptyLinesTool() {
  return (
    <TextTransformTool
      title="Remove empty lines"
      description="Delete blank lines from pasted text while keeping the remaining lines in order."
      outputTitle="Text without empty lines"
      transform={removeEmptyLines}
    />
  );
}
