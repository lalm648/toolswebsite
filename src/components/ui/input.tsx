import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4 py-3 text-base text-[var(--ink-900)] shadow-[var(--shadow-soft)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--accent-500)] focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
