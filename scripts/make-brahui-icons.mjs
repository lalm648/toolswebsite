/*
  Generates the Brahui app's launcher icons.

  The mark is the same ب the app bar draws, on the app's emerald. It is drawn
  from a font rather than a hand-made path so the letterform is a real one, and
  it is placed by measuring its ink rather than by its baseline: an Arabic glyph
  sits low in its em box — the dot of ب hangs below the bowl — so centring on
  the baseline leaves the mark visibly low in the square. Here the glyph is
  rendered alone, trimmed to its ink, scaled to a share of the square and
  composited dead centre.

  Two shapes, because Android asks for both. The plain icon is a rounded square
  and is used as-is. The maskable one is full-bleed and keeps its mark inside the
  safe circle (the middle 80%), because the launcher may crop it to a circle, a
  squircle or a rounded square depending on the device.

  Run: node scripts/make-brahui-icons.mjs
*/
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "brahui", "icons");
const EMERALD = "#047857";
const GLYPH = "\u0628";
const FONTS = "Segoe UI, Noto Naskh Arabic, Noto Sans Arabic, Arial";

/** The glyph alone, white on transparent, trimmed to its ink. */
async function mark(px) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px * 2}" height="${px * 2}">
    <text x="${px}" y="${px * 1.4}" font-family="${FONTS}" font-size="${px}"
          font-weight="700" fill="#ffffff" text-anchor="middle">${GLYPH}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).trim().png().toBuffer();
}

async function icon(size, { maskable }) {
  // Share of the square the mark may occupy. The maskable one is smaller so it
  // survives a circular crop with the 80% safe zone intact.
  const share = maskable ? 0.44 : 0.58;
  const trimmed = await mark(size);
  const meta = await sharp(trimmed).metadata();
  const scale = (size * share) / Math.max(meta.width, meta.height);
  const glyph = await sharp(trimmed)
    .resize(Math.round(meta.width * scale), Math.round(meta.height * scale))
    .png()
    .toBuffer();
  const g = await sharp(glyph).metadata();

  const radius = maskable ? 0 : Math.round(size * 0.22);
  const plate = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${EMERALD}"/>
  </svg>`;

  return sharp(Buffer.from(plate))
    .composite([{
      input: glyph,
      left: Math.round((size - g.width) / 2),
      top: Math.round((size - g.height) / 2),
    }])
    .png()
    .toBuffer();
}

const jobs = [
  ["icon-192.png", 192, { maskable: false }],
  ["icon-512.png", 512, { maskable: false }],
  ["icon-maskable-192.png", 192, { maskable: true }],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: true }],
];

await sharp({ create: { width: 1, height: 1, channels: 4, background: "#0000" } }).png().toBuffer();
const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
for (const [name, size, opts] of jobs) {
  await writeFile(path.join(OUT, name), await icon(size, opts));
  console.log("wrote", name, size + "px", opts.maskable ? "maskable" : "any");
}
