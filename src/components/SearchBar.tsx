"use client";

import { Input } from "@/components/ui/input";

type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search tools like JPG to PNG, Word Counter, JSON Formatter",
}: SearchBarProps) {
  const inputLabel = "Search tools";

  return (
    <div className="mx-auto max-w-2xl">
      <label className="relative block text-start">
        <span className="sr-only">{inputLabel}</span>
        <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[var(--accent-500)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          className="pl-14 pr-6"
        />
      </label>
    </div>
  );
}
