import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

/*
  Renders a recording for one or more Brahui words named on the command line.

  Same pipeline as scripts/render-audio-edge.mjs — Devanagari through a Hindi
  neural voice, because Lekha (the macOS voice the library was built with) reads
  Devanagari and cannot run here — but driven by arguments rather than the
  re-render manifest, for words added after that manifest was written.

  Three things have to line up or a rendered file is inert: it must be named for
  the key audioKey() computes, AUDIOKEYS in the page must list it, because
  speak() gates on that list and not on the folder, and AUDIOREV must move when
  an existing key is overwritten or browsers keep the cached pronunciation.
  This does all three.

  Run: node scripts/render-words.mjs mací murú kapoth
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "public", "brahui", "index.html");
const AUDIO = path.join(ROOT, "public", "brahui", "audio");

const VOICE = process.env.BRAHUI_VOICE || "hi-IN-MadhurNeural";
const RATE = process.env.BRAHUI_RATE || "-12%";

const words = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!words.length) {
  console.error("usage: node scripts/render-words.mjs <latin> [<latin> ...]");
  process.exit(1);
}

let html = fs.readFileSync(HTML, "utf8");
const slice = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); return html.slice(i, j); };
const coll = /const AUDIOCOLLISIONKEYS=(\[[^\]]*\]);/.exec(html);

const box = {};
vm.createContext(box);
vm.runInContext([
  slice("const C = {", "/* ---------- 2. ENGINE ---------- */"),
  slice("function tokenize(word){", "/* opts.sukun"),
  slice("const DEVA_C={", "function lineDeva"),
  "function lineDeva(t){ return t.split(/\\s+/).filter(Boolean).map(toDeva).join(' '); }",
  `const AUDIOCOLLISIONSET=new Set(${coll[1]});`,
  slice("function audioKey(s){", "\nlet clip=null;"),
].join("\n"), box);

const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"])
  .toString().trim();

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "brahui-"));
const done = [];
let overwrote = false;

for (const w of words) {
  const key = box.audioKey(w.trim());
  const deva = box.lineDeva(w.trim());
  const out = path.join(AUDIO, key + ".m4a");
  const existed = fs.existsSync(out);
  const mp3 = path.join(tmp, key + ".mp3");
  execFileSync("python",
    ["-m", "edge_tts", "--voice", VOICE, "--rate", RATE, "--text", deva, "--write-media", mp3],
    { stdio: ["ignore", "ignore", "pipe"] });
  /* Matches the existing library: AAC-LC, 22050 Hz, mono, 32 kb/s. */
  execFileSync(ffmpeg,
    ["-y", "-loglevel", "error", "-i", mp3, "-c:a", "aac", "-profile:a", "aac_low",
     "-ac", "1", "-ar", "22050", "-b:a", "32k", out],
    { stdio: ["ignore", "ignore", "pipe"] });
  if (existed) overwrote = true;
  done.push(key);
  console.log(`  ${w.padEnd(10)} ${key}  ${deva.padEnd(12)} ${existed ? "overwritten" : "created"}`);
}

fs.rmSync(tmp, { recursive: true, force: true });

const m = /const AUDIOKEYS=(\[[^\]]*\]);/.exec(html);
const keys = new Set(JSON.parse(m[1]));
const before = keys.size;
for (const k of done) keys.add(k);
html = html.replace(m[0], "const AUDIOKEYS=" + JSON.stringify([...keys]) + ";");

/* Only when a key was reused — a new key needs no cache bust, and moving
   AUDIOREV re-downloads all 6,600 clips for everyone. */
if (overwrote) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-madhur-r2";
  html = html.replace(/const AUDIOREV='[^']*';/, `const AUDIOREV='${stamp}';`);
  console.log(`  AUDIOREV bumped to ${stamp} (a key was reused)`);
}

fs.writeFileSync(HTML, html);
console.log(`\nAUDIOKEYS ${before} -> ${keys.size}`);
