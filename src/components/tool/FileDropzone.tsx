"use client";

import { useId, useState, type DragEvent } from "react";

type FileDropzoneProps = {
  accept: string;
  files: File[];
  onFiles: (files: File[]) => void;
  onError: (message: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  maxTotalSize?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 bytes";
  const units = ["bytes", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function matchesAccept(file: File, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export default function FileDropzone({
  accept,
  files,
  onFiles,
  onError,
  multiple = false,
  maxFiles = multiple ? 50 : 1,
  maxFileSize = 100 * 1024 * 1024,
  maxTotalSize = 500 * 1024 * 1024,
  label = "Choose files",
  hint,
  disabled = false,
}: FileDropzoneProps) {
  const id = useId();
  const [dragActive, setDragActive] = useState(false);

  function select(next: File[]) {
    const limited = next.slice(0, multiple ? maxFiles : 1);
    const invalid = limited.find((file) => !matchesAccept(file, accept));
    if (invalid) {
      onError(`${invalid.name} is not a supported file type.`);
      return;
    }
    const oversized = limited.find((file) => file.size > maxFileSize);
    if (oversized) {
      onError(`${oversized.name} exceeds the ${formatBytes(maxFileSize)} per-file limit.`);
      return;
    }
    const total = limited.reduce((sum, file) => sum + file.size, 0);
    if (total > maxTotalSize) {
      onError(`The selected files exceed the ${formatBytes(maxTotalSize)} combined limit.`);
      return;
    }
    if (next.length > limited.length) {
      onError(`Choose no more than ${multiple ? maxFiles : 1} file${multiple && maxFiles !== 1 ? "s" : ""}.`);
      return;
    }
    onError("");
    onFiles(limited);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (!disabled) select(Array.from(event.dataTransfer.files));
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false);
      }}
      onDrop={handleDrop}
      className={`tool-upload-soft-3d mt-4 rounded-[var(--radius-md)] border border-dashed p-4 text-center transition-all ${
        dragActive
          ? "border-[var(--accent-500)] bg-[var(--accent-50)]"
          : "border-[var(--outline-strong)] bg-[var(--surface-panel)]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <label
        htmlFor={id}
        className="block cursor-pointer rounded-xl px-3 py-2 focus-within:ring-4 focus-within:ring-[var(--ring-soft)]"
      >
        <input
          id={id}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => select(Array.from(event.target.files ?? []))}
        />
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-100)] text-[var(--accent-700)]" aria-hidden="true">
          ↑
        </span>
        <span className="mt-2 block text-sm font-bold text-[var(--ink-900)]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
          {hint ?? `Drop ${multiple ? "files" : "a file"} here or browse`}
        </span>
      </label>

      {files.length ? (
        <ul className="mt-3 space-y-1 border-t border-[var(--outline-soft)] pt-3 text-left" aria-label="Selected files">
          {files.slice(0, 3).map((file) => (
            <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-[var(--ink-900)]">{file.name}</span>
              <span className="shrink-0 text-[var(--muted-foreground)]">{formatBytes(file.size)}</span>
            </li>
          ))}
          {files.length > 3 ? <li className="text-xs text-[var(--muted-foreground)]">+ {files.length - 3} more</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
