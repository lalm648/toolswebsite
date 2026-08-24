"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { trackSearch } from "@/lib/analytics";

type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  analyticsSource?: string;
  size?: "default" | "lg";
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search tools like JPG to PNG, Word Counter, JSON Formatter",
  analyticsSource,
  size = "default",
}: SearchBarProps) {
  const large = size === "lg";
  const inputLabel = "Search tools";
  const lastTrackedQueryRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !editing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function maybeTrackQuery(nextValue: string) {
    const normalized = nextValue.trim();

    if (!analyticsSource || !normalized || normalized === lastTrackedQueryRef.current) {
      return;
    }

    lastTrackedQueryRef.current = normalized;
    trackSearch(normalized, analyticsSource);
  }

  return (
    <div className={large ? "mx-auto max-w-[720px]" : "mx-auto max-w-2xl"}>
      <label className="relative block text-start">
        <span className="sr-only">{inputLabel}</span>
        <span className={`pointer-events-none absolute inset-y-0 flex items-center text-[var(--accent-500)] ${large ? "left-5" : "left-5"}`}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={large ? "h-6 w-6" : "h-5 w-5"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={(event) => maybeTrackQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              maybeTrackQuery(event.currentTarget.value);
            }
          }}
          placeholder={placeholder}
          aria-label={inputLabel}
          className={large ? "h-16 rounded-2xl border-[var(--outline-strong)] pl-14 pr-16 text-base shadow-[var(--shadow-soft)] sm:text-lg" : "pl-14 pr-12"}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange?.("");
              inputRef.current?.focus();
            }}
            className={`absolute top-1/2 grid -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-[var(--outline-soft)] bg-[var(--surface-panel)] text-[var(--muted-foreground)] hover:border-[var(--accent-300)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] ${large ? "right-4 h-9 w-9" : "right-3 h-8 w-8"}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        ) : large ? (
          <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--outline-soft)] bg-[var(--surface-panel)] px-2 py-1 text-xs font-semibold text-[var(--muted-foreground)] sm:inline-flex">
            /
          </span>
        ) : null}
      </label>
    </div>
  );
}
