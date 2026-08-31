/*
  The gradient wash behind an editorial hero.

  Deliberately a plain radial-gradient rather than a blurred layer. A CSS blur
  filter on an element this size forces the compositor to rasterize a large
  surface on every paint, which is exactly the cost the redesign is required
  not to add. A soft radial gradient reads the same and costs nothing measurable.

  Purely decorative, so it is hidden from assistive technology and cannot receive
  pointer events. It is absolutely positioned and given an explicit size by its
  caller, so it never participates in layout and cannot shift the hero.
*/

type BrandBloomProps = {
  className?: string;
  width?: string;
  height?: string;
};

export default function BrandBloom({
  className = "",
  width = "900px",
  height = "560px",
}: BrandBloomProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height, background: "var(--brand-bloom)" }}
      className={`pointer-events-none absolute -z-10 ${className}`}
    />
  );
}
