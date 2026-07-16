"use client";

/** Triggers a client-side download of a text string as a file. */
export function downloadTextFile(content: string, fileName: string, mimeType = "text/plain") {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
