import fs from "node:fs";
import path from "node:path";

/*
  Takes a rendered clip back out of the library.

  A pronunciation guide that plays the wrong sound is worse than one that plays
  nothing, which is why speak() refuses to substitute a device voice. The same
  rule has to apply to clips we render: if a speaker says a syllable came out
  wrong, it goes, and the row falls back to silence until it can be made
  properly.

  Retracting means two things, not one. The .m4a is deleted, and the key is
  removed from AUDIOKEYS — speak() gates on that list rather than on the folder,
  so a key left behind would keep the row looking playable and fail at fetch.

  Run: node scripts/retract-audio.mjs <latin text> [...]
       node scripts/retract-audio.mjs --file retract.txt
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const AUDIO = path.join(ROOT, "public", "brahui", "audio");
const HTML = path.join(ROOT, "public", "brahui", "index.html");
const MANIFEST = path.join(ROOT, "audio-rerender.json");

const args = process.argv.slice(2);
let texts = args;
if (args[0] === "--file") {
  texts = fs.readFileSync(args[1], "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
if (!texts.length) {
  console.error("nothing to retract — pass the Latin text of each clip");
  process.exit(1);
}

/* Keys come from the manifest so they are the same ones the renderer wrote,
   rather than recomputed here and at risk of drifting from it. */
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const byText = new Map(manifest.entries.map((e) => [e.text, e]));

const retract = [];
const unknown = [];
for (const t of texts) {
  const e = byText.get(t);
  if (e) retract.push(e);
  else unknown.push(t);
}

let html = fs.readFileSync(HTML, "utf8");
const m = /const AUDIOKEYS=(\[[^\]]*\]);/.exec(html);
if (!m) throw new Error("AUDIOKEYS not found in index.html");
const keys = new Set(JSON.parse(m[1]));
const before = keys.size;

let deleted = 0;
for (const e of retract) {
  const f = path.join(AUDIO, e.key + ".m4a");
  if (fs.existsSync(f)) { fs.unlinkSync(f); deleted++; }
  keys.delete(e.key);
  console.log(`  retracted  ${e.key}  ${e.text}`);
}

html = html.replace(m[0], "const AUDIOKEYS=" + JSON.stringify([...keys]) + ";");
fs.writeFileSync(HTML, html);

/* Drop them from the manifest too, or the next render puts them straight back. */
manifest.entries = manifest.entries.filter((e) => !retract.some((r) => r.key === e.key));
manifest.count = manifest.entries.length;
manifest.replace = manifest.entries.filter((e) => e.existsOnDisk).length;
manifest.create = manifest.entries.filter((e) => !e.existsOnDisk).length;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

console.log(`\nfiles deleted   ${deleted}`);
console.log(`AUDIOKEYS       ${before} -> ${keys.size}`);
console.log(`manifest        ${manifest.entries.length} entries remain`);
if (unknown.length) {
  console.log(`\nnot found in the manifest (nothing done):`);
  for (const u of unknown) console.log(`   ${u}`);
}
