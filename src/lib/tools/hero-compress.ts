/*
  Pure helpers for the home page's hero compressor. They are deliberately free of
  DOM and canvas references so the arithmetic is unit-tested in Node — the hero
  makes a real claim about how much a file shrank, and a wrong number there is a
  false claim about the product rather than a cosmetic bug.
*/

export type HeroDimensions = {
  width: number;
  height: number;
};

export function heroTargetDimensions(
  width: number,
  height: number,
  maxEdge = 1600,
): HeroDimensions {
  const longest = Math.max(width, height);

  if (longest <= maxEdge) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type CompressionSummary = {
  ratio: number;
  savedBytes: number;
  savedPercent: number;
};

export function compressionSummary(
  originalBytes: number,
  compressedBytes: number,
): CompressionSummary {
  if (originalBytes <= 0) {
    return { ratio: 0, savedBytes: 0, savedPercent: 0 };
  }

  // Clamped so a file that grew renders a full meter rather than overflowing it,
  // and so the hero never reports a negative saving as a positive one.
  const ratio = Math.min(Math.max(compressedBytes / originalBytes, 0), 1);
  const savedBytes = Math.max(originalBytes - compressedBytes, 0);
  const roundedPercent = Math.round((savedBytes / originalBytes) * 100);

  // Rounding alone lets an ordinary compression (e.g. 10 MB -> 50 KB, 99.51%
  // saved) display as "100% smaller", which falsely claims the file compressed
  // to nothing. Report 100 only when it is literally true — all bytes gone —
  // and cap every other case at 99 so the label never overstates the result.
  // Do not "simplify" this back to a plain Math.round.
  const savedPercent = savedBytes === originalBytes ? 100 : Math.min(roundedPercent, 99);

  return { ratio, savedBytes, savedPercent };
}
