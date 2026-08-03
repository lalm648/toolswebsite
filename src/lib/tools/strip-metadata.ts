/**
 * Lossless metadata removal for JPEG and PNG.
 *
 * Re-encoding through a canvas does strip metadata, but it also recompresses the image
 * and throws away the colour profile — so a tool that promises "visual content is
 * preserved" was not telling the truth. These functions edit the container instead:
 * the compressed image data is copied through byte for byte, so the pixels that come
 * out are bit-identical to the pixels that went in.
 *
 * The colour profile is deliberately kept. It describes how to render the image, not
 * who made it or where, so discarding it would change appearance without improving
 * privacy.
 */

export type MetadataStripResult = {
  bytes: Uint8Array;
  /** Human-readable names of what was removed, for reporting back to the user. */
  removed: string[];
  /** False when the format has no lossless path here and the caller must re-encode. */
  lossless: boolean;
};

const jpegSegmentNames: Record<number, string> = {
  0xe1: "EXIF / XMP",
  0xe2: "ICC colour profile",
  0xe3: "Camera data",
  0xe4: "Camera data",
  0xe5: "Camera data",
  0xe6: "Camera data",
  0xe7: "Camera data",
  0xe8: "Camera data",
  0xe9: "Camera data",
  0xea: "Camera data",
  0xeb: "Camera data",
  0xec: "Picture info",
  0xed: "IPTC / Photoshop",
  0xee: "Adobe data",
  0xef: "Camera data",
  0xfe: "Comment",
};

// APP0 holds JFIF density and APP2 holds the ICC profile; both affect rendering.
const jpegKeepMarkers = new Set([0xe0, 0xe2]);

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function isPng(bytes: Uint8Array) {
  return (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function stripJpeg(bytes: Uint8Array): MetadataStripResult {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
  const removed = new Set<string>();
  let offset = 2;

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      // Not a marker boundary — copy the remainder untouched rather than guess.
      kept.push(bytes.subarray(offset));
      break;
    }

    const marker = bytes[offset + 1];

    // Start of scan: everything after this is entropy-coded image data.
    if (marker === 0xda) {
      kept.push(bytes.subarray(offset));
      break;
    }

    // Standalone markers carry no length field.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(bytes.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];

    if (length < 2 || offset + 2 + length > bytes.length) {
      kept.push(bytes.subarray(offset));
      break;
    }

    const isMetadata =
      ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) &&
      !jpegKeepMarkers.has(marker);

    if (isMetadata) {
      removed.add(jpegSegmentNames[marker] ?? "Metadata");
    } else {
      kept.push(bytes.subarray(offset, offset + 2 + length));
    }

    offset += 2 + length;
  }

  const total = kept.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let position = 0;

  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }

  return { bytes: output, removed: [...removed], lossless: true };
}

const pngChunkNames: Record<string, string> = {
  tEXt: "Text metadata",
  zTXt: "Compressed text metadata",
  iTXt: "XMP / international text",
  eXIf: "EXIF",
  tIME: "Last-modified time",
};

function stripPng(bytes: Uint8Array): MetadataStripResult {
  const kept: Uint8Array[] = [bytes.subarray(0, 8)]; // signature
  const removed = new Set<string>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    const total = 12 + length;

    if (offset + total > bytes.length) {
      break;
    }

    if (type in pngChunkNames) {
      removed.add(pngChunkNames[type]);
    } else {
      kept.push(bytes.subarray(offset, offset + total));
    }

    offset += total;

    if (type === "IEND") {
      break;
    }
  }

  const size = kept.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let position = 0;

  for (const part of kept) {
    output.set(part, position);
    position += part.length;
  }

  return { bytes: output, removed: [...removed], lossless: true };
}

/**
 * Strips identifying metadata without touching pixel data.
 * Returns `lossless: false` for formats with no container-level path here, so the
 * caller can fall back to a re-encode and say so.
 */
export function stripImageMetadata(bytes: Uint8Array): MetadataStripResult {
  if (isJpeg(bytes)) return stripJpeg(bytes);
  if (isPng(bytes)) return stripPng(bytes);
  return { bytes, removed: [], lossless: false };
}
