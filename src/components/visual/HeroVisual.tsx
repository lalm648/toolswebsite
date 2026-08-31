/*
  The seam between the art we generate and the imagery the owner will supply later.

  Every hero declares a named `slot`. Today the slots render inline SVG built from
  brand tokens, which costs no network request and themes automatically. When real
  images arrive they are passed as `src` with explicit dimensions and the layout
  does not move — which is the whole point of the indirection.

  The aspect ratio is fixed on the wrapper in both branches, so the space is
  reserved before anything paints and swapping art for a photograph cannot shift
  the page.
*/

import type { ReactNode } from "react";
import Image from "next/image";
import BrandBloom from "@/components/visual/BrandBloom";

type HeroVisualProps = {
  slot: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  children?: ReactNode;
  className?: string;
};

export default function HeroVisual({
  slot,
  src,
  alt,
  width,
  height,
  children,
  className = "",
}: HeroVisualProps) {
  const gradientId = `hero-${slot.replace(/[^a-z0-9-]/gi, "-")}`;

  return (
    <div
      data-hero-slot={slot}
      className={`relative isolate aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)] ${className}`}
    >
      <BrandBloom className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />

      {src && alt && width && height ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-cover"
        />
      ) : (
        children ?? (
          <svg
            viewBox="0 0 400 300"
            role="img"
            aria-label="Abstract mark built from the Webutilia brand gradient"
            className="h-full w-full"
          >
            <defs>
              {/*
                This gradient's stops are fixed brand tokens and never vary with
                `slot`, so a duplicate `slot` across two instances resolves to a
                byte-identical gradient and stays visually correct — the id
                collision is invalid markup, not a rendering bug. If the gradient
                is ever made to depend on `slot`, switch to a guaranteed-unique id
                first.
              */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--brand-mint)" />
                <stop offset="0.5" stopColor="var(--brand-spring)" />
                <stop offset="1" stopColor="var(--brand-lime)" />
              </linearGradient>
            </defs>
            <rect
              x="120"
              y="70"
              width="160"
              height="160"
              rx="36"
              fill={`url(#${gradientId})`}
            />
          </svg>
        )
      )}
    </div>
  );
}
