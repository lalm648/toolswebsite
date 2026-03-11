import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-36 w-full rounded-2xl border border-[var(--outline-soft)] bg-[var(--surface-raised)] px-4 py-3 text-base text-[var(--ink-900)] shadow-[var(--shadow-soft)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--accent-500)] focus-visible:ring-4 focus-visible:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
