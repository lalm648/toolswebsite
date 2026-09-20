import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

/*
  Renders the clips listed in audio-rerender.json.

  The library was built with Lekha, the macOS Hindi voice, reading Devanagari.
  That is a Mac-only tool, so this is the cross-platform equivalent: the same
  Devanagari, read by a Hindi neural voice through edge-tts. A Brahui speaker
  compared the candidates and chose hi-IN-MadhurNeural — Urdu voices reading
  Urdu script were tried first and were wrong for Brahui, which is the whole
  reason the script matters more than the language label.

  Render the `deva` field. Not the Latin, not the Urdu.

  Output matches the existing 6,646 clips so the new ones do not stand out:
  AAC-LC, 22050 Hz, mono, 32 kb/s in an .m4a container. edge-tts emits mp3, so
  ffmpeg transcodes.

  Requires:  python -m pip install edge-tts imageio-ffmpeg
  Run:       node scripts/render-audio-edge.mjs [--dry] [--only <key>]
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST = path.join(ROOT, "audio-rerender.json");
const AUDIO = path.join(ROOT, "public", "brahui", "audio");
const HTML = path.join(ROOT, "public", "brahui", "index.html");

const VOICE = process.env.BRAHUI_VOICE || "hi-IN-MadhurNeural";
/* Lekha's clips are read slower than conversation — these are pronunciation
   models, not speech. edge-tts takes a percentage offset from the voice's
   natural rate. */
const RATE = process.env.BRAHUI_RATE || "-12%";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const ffmpeg = execFileSync("python", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"])
  .toString()
  .trim();

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
let entries = manifest.entries;
if (only) entries = entries.filter((e) => e.key === only);

console.log(`voice   ${VOICE}   rate ${RATE}`);
console.log(`entries ${entries.length}${dry ? "   (dry run — nothing written)" : ""}\n`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "brahui-"));
let done = 0;
const failed = [];

for (const e of entries) {
  const mp3 = path.join(tmp, e.key + ".mp3");
  const out = path.join(AUDIO, e.key + ".m4a");
  try {
    execFileSync(
      "python",
      ["-m", "edge_tts", "--voice", VOICE, "--rate", RATE, "--text", e.deva, "--write-media", mp3],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    if (!dry) {
      /* -ac 1 -ar 22050 -b:a 32k matches the existing library exactly, so a new
         clip is indistinguishable from an old one in size and timbre. */
      execFileSync(
        ffmpeg,
        ["-y", "-loglevel", "error", "-i", mp3, "-c:a", "aac", "-profile:a", "aac_low",
         "-ac", "1", "-ar", "22050", "-b:a", "32k", out],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
    }
    done++;
    process.stdout.write(`  ${e.key}  ${e.existsOnDisk ? "replaced" : "created "}  ${e.deva.slice(0, 44)}\n`);
  } catch (err) {
    failed.push({ key: e.key, text: e.text, err: String(err.stderr || err).slice(0, 120) });
    process.stdout.write(`  ${e.key}  FAILED    ${e.text.slice(0, 44)}\n`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\nrendered ${done} of ${entries.length}`);
if (failed.length) {
  console.log(`failed ${failed.length}:`);
  for (const f of failed) console.log(`   ${f.key}  ${f.text}  ${f.err}`);
}

/* speak() gates on the AUDIOKEYS list baked into the page, not on what is in
   the audio folder — the list ships with the HTML so the app still works opened
   straight from disk. A rendered file the list does not name is invisible, so
   the list has to be rewritten here the way build-audio.js used to. */
function syncAudioKeys(renderedKeys) {
  const html = fs.readFileSync(HTML, "utf8");
  const m = /const AUDIOKEYS=(\[[^\]]*\]);/.exec(html);
  if (!m) return { ok: false, added: 0 };
  const existing = JSON.parse(m[1]);
  const set = new Set(existing);
  let added = 0;
  for (const k of renderedKeys) if (!set.has(k)) { set.add(k); added++; }
  if (!added) return { ok: true, added: 0, total: existing.length };
  const next = html.replace(m[0], "const AUDIOKEYS=" + JSON.stringify([...set]) + ";");
  fs.writeFileSync(HTML, next);
  return { ok: true, added, total: set.size };
}

if (!dry && done > 0) {
  const rendered = entries
    .filter((e) => !failed.some((f) => f.key === e.key))
    .map((e) => e.key);
  const sync = syncAudioKeys(rendered);
  if (!sync.ok) console.log("WARNING: AUDIOKEYS not found — the app will not see the new clips");
  else console.log(`AUDIOKEYS +${sync.added} (now ${sync.total})`);
}

if (!dry && done > 0 && !only) {
  /* A replaced clip keeps its key, so a browser holding the old pronunciation
     would go on playing it. AUDIOREV is the cache buster — without this bump
     the fix reaches nobody who has already opened the app. */
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-madhur-r1";
  const html = fs.readFileSync(HTML, "utf8");
  const next = html.replace(/const AUDIOREV='[^']*';/, `const AUDIOREV='${stamp}';`);
  if (next === html) {
    console.log("WARNING: AUDIOREV not found — bump it by hand");
  } else {
    fs.writeFileSync(HTML, next);
    console.log(`AUDIOREV bumped to ${stamp}`);
  }
}
