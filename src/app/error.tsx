"use client";

import Link from "next/link";
import { useEffect } from "react";
import Container from "@/components/Container";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * A render error used to take the whole page down to Next's default screen. This keeps
 * the user inside the site and offers a retry, which is usually enough because most
 * failures here come from a chunk that did not download.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-[var(--space-section)] sm:py-[var(--space-section-lg)]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-sm font-semibold tracking-[0.18em] text-[var(--error-foreground)]">
            Something broke
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            This tool stopped responding
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
            Nothing you uploaded left your device, and nothing was saved. Trying again
            usually works — if it does not, reload the page or pick another tool.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Link href="/#tool-library" className={buttonVariants({ variant: "secondary" })}>Browse all tools</Link>
          </div>
          {error.digest ? (
            <p className="mt-6 font-mono text-xs text-[var(--muted-foreground)]">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
