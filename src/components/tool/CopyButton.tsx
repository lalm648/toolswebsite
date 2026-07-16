"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  onCopied?: () => void;
};

export default function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied!",
  size = "sm",
  variant = "secondary",
  className,
  disabled,
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    if (!value) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for insecure contexts / older browsers.
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      onCopied?.();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={handleCopy}
      disabled={disabled || !value}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
