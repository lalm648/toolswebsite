/*
  WCAG 2.1 contrast maths. This exists so the brand's contrast rule is enforced by
  the test suite rather than by review: the logo's mint and greenyellow are light
  enough that using either as a text colour on a light surface fails badly, and a
  future edit to globals.css should break a test rather than ship quietly.
*/

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(hex: string): [number, number, number] {
  if (typeof hex !== "string" || !HEX_PATTERN.test(hex)) {
    throw new TypeError(`Expected a #RGB or #RRGGBB colour, received: ${String(hex)}`);
  }

  const digits = hex.slice(1);
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;

  const value = Number.parseInt(full, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelLuminance(channel: number): number {
  const ratio = channel / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex);
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
}

export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
