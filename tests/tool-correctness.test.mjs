import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";

import { findPrecisionRisks, reformatJson } from "../src/lib/tools/json-format.ts";
import { stripImageMetadata } from "../src/lib/tools/strip-metadata.ts";
import {
  resolveOutputDimensions,
  MAX_OUTPUT_PIXELS,
} from "../src/lib/image-conversion.ts";

test("JSON formatting preserves numbers that a float round trip would corrupt", () => {
  const source = '{"id":12345678901234567890,"ratio":1.0,"tiny":1e-7}';
  const result = reformatJson(source, "  ");

  assert.equal(result.ok, true);
  // JSON.parse + JSON.stringify would return 12345678901234568000 and 1 here.
  assert.match(result.output, /12345678901234567890/);
  assert.match(result.output, /"ratio": 1\.0/);
  assert.match(result.output, /"tiny": 1e-7/);

  assert.deepEqual(findPrecisionRisks('{"id":12345678901234567890}'), [
    "12345678901234567890",
  ]);
});

test("JSON formatting round-trips structure and minifies without spaces", () => {
  const source = '{ "a" : [ 1 , { "b" : null } ] , "c" : "x\\"y" }';

  const pretty = reformatJson(source, "  ");
  assert.equal(pretty.ok, true);
  assert.equal(
    pretty.output,
    '{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ],\n  "c": "x\\"y"\n}',
  );

  const minified = reformatJson(source, "");
  assert.equal(minified.ok, true);
  assert.equal(minified.output, '{"a":[1,{"b":null}],"c":"x\\"y"}');

  // Empty containers stay compact in both modes.
  assert.equal(reformatJson('{"a":{},"b":[]}', "  ").output, '{\n  "a": {},\n  "b": []\n}');
});

test("JSON errors report a line and column instead of a bare message", () => {
  const result = reformatJson('{\n  "a": 1,\n  "b": oops\n}', "  ");

  assert.equal(result.ok, false);
  assert.equal(result.error.line, 3);
  assert.ok(result.error.column > 1);
  assert.match(result.error.message, /Unexpected/);

  for (const invalid of ['{"a":}', "[1,]", '{"a" 1}', '{a:1}', '"unterminated', "01"]) {
    assert.equal(reformatJson(invalid, "  ").ok, false, `${invalid} should be rejected`);
  }
});

test("JPEG metadata stripping removes EXIF while copying scan data byte for byte", () => {
  const app0 = Buffer.concat([
    Buffer.from([0xff, 0xe0, 0x00, 0x10]),
    Buffer.from("JFIF\0\0\0\0\0\0", "latin1"),
  ]);
  const exifPayload = Buffer.from("Exif\0\0SENSITIVE-GPS-DATA", "latin1");
  const app1 = Buffer.concat([
    Buffer.from([0xff, 0xe1]),
    Buffer.from([((exifPayload.length + 2) >> 8) & 0xff, (exifPayload.length + 2) & 0xff]),
    exifPayload,
  ]);
  const comment = Buffer.concat([
    Buffer.from([0xff, 0xfe, 0x00, 0x08]),
    Buffer.from("camera", "latin1"),
  ]);
  const scan = Buffer.from([0xff, 0xda, 0x00, 0x03, 0x01, 0xaa, 0xbb, 0xcc, 0xff, 0xd9]);
  const jpeg = new Uint8Array(
    Buffer.concat([Buffer.from([0xff, 0xd8]), app0, app1, comment, scan]),
  );

  const result = stripImageMetadata(jpeg);
  const output = Buffer.from(result.bytes);

  assert.equal(result.lossless, true);
  assert.ok(result.removed.includes("EXIF / XMP"));
  assert.ok(result.removed.includes("Comment"));
  assert.equal(output.includes("SENSITIVE-GPS-DATA"), false);
  assert.equal(output.includes("camera"), false);
  // JFIF density is rendering information, so it stays.
  assert.ok(output.includes("JFIF"));
  // The entropy-coded scan survives untouched — this is what makes it lossless.
  assert.ok(output.subarray(output.length - scan.length).equals(scan));
  assert.ok(output.length < jpeg.length);
});

test("PNG metadata stripping removes text chunks and keeps image data identical", () => {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let crc = 0xffffffff;
    for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed));
    return Buffer.concat([length, typed, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = chunk("IDAT", zlib.deflateSync(Buffer.from([0, 255, 0, 0, 255])));
  const png = new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("tEXt", Buffer.from("Author\0Jane Doe", "latin1")),
      chunk("eXIf", Buffer.from("GPS", "latin1")),
      idat,
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );

  const result = stripImageMetadata(png);
  const output = Buffer.from(result.bytes);

  assert.equal(result.lossless, true);
  assert.ok(result.removed.includes("Text metadata"));
  assert.ok(result.removed.includes("EXIF"));
  assert.equal(output.includes("Jane Doe"), false);
  // Pixel data is bit-identical, and the critical chunks are all still present.
  assert.ok(output.includes(idat));
  assert.ok(output.includes(Buffer.from("IHDR", "latin1")));
  assert.ok(output.includes(Buffer.from("IEND", "latin1")));
});

test("unrecognised formats report that no lossless path was taken", () => {
  const result = stripImageMetadata(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  assert.equal(result.lossless, false);
  assert.deepEqual(result.removed, []);
});

test("unlocking the aspect ratio uses the requested dimensions verbatim", () => {
  // Locked: the box constrains, the ratio is preserved.
  assert.deepEqual(resolveOutputDimensions(1600, 900, 800, 800), {
    width: 800,
    height: 450,
    clamped: false,
  });

  // Unlocked: 800x800 means 800x800. Previously this also returned 800x450.
  assert.deepEqual(
    resolveOutputDimensions(1600, 900, 800, 800, { lockAspectRatio: false }),
    { width: 800, height: 800, clamped: false },
  );

  // No limits given means leave the source alone.
  assert.deepEqual(resolveOutputDimensions(120, 80), {
    width: 120,
    height: 80,
    clamped: false,
  });

  // Upscaling stays opt-in.
  assert.deepEqual(resolveOutputDimensions(100, 100, 400, 400), {
    width: 100,
    height: 100,
    clamped: false,
  });
  assert.deepEqual(
    resolveOutputDimensions(100, 100, 400, 400, { allowUpscale: true }),
    { width: 400, height: 400, clamped: false },
  );
});

test("the pixel budget clamps requests that browsers cannot export", () => {
  const resolved = resolveOutputDimensions(12000, 12000, 12000, 12000, {
    lockAspectRatio: false,
  });

  assert.equal(resolved.clamped, true);
  assert.ok(resolved.width * resolved.height <= MAX_OUTPUT_PIXELS);
  // Still square, just smaller.
  assert.equal(resolved.width, resolved.height);
});
