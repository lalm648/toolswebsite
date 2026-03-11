"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ResolvedTheme = "light" | "dark";

function getResolvedTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem("theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const nextTheme =
        document.documentElement.dataset.theme === "dark" ? "dark" : getResolvedTheme();
      setTheme(nextTheme);
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem("theme", theme);
  }, [mounted, theme]);

  if (!mounted) {
    return (
      <Button type="button" variant="secondary" size="sm" className="min-w-24 gap-2" aria-label="Theme toggle">
        <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.5" />
          </svg>
        </span>
        <span>Theme</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="min-w-24 gap-2"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          {isDark ? (
            <>
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2.5v2.5" />
              <path d="M12 19v2.5" />
              <path d="m4.9 4.9 1.8 1.8" />
              <path d="m17.3 17.3 1.8 1.8" />
              <path d="M2.5 12H5" />
              <path d="M19 12h2.5" />
              <path d="m4.9 19.1 1.8-1.8" />
              <path d="m17.3 6.7 1.8-1.8" />
            </>
          ) : (
            <path d="M21 13.2A8.5 8.5 0 1 1 10.8 3 6.8 6.8 0 0 0 21 13.2Z" />
          )}
        </svg>
      </span>
      <span suppressHydrationWarning>{isDark ? "Light" : "Dark"}</span>
    </Button>
  );
}
