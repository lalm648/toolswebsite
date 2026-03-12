"use client";

import TextTransformTool from "@/components/tool/TextTransformTool";

function removeDuplicateLines(value: string) {
  const seen = new Set<string>();

  return value
    .split(/\r?\n/)
    .filter((line) => {
      if (seen.has(line)) {
        return false;
      }

      seen.add(line);
      return true;
    })
    .join("\n");
}

export default function RemoveDuplicateLinesTool() {
  return (
    <TextTransformTool
      title="Remove duplicate lines"
      description="Clean lists and repeated entries instantly while preserving the first occurrence of each line."
      outputTitle="Deduplicated text"
      transform={removeDuplicateLines}
    />
  );
}
