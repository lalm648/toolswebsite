import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/*
  Corrects the spelling of a Brahui entry without losing its recording.

  The audio key is a hash of the Latin text, so any spelling fix silently
  orphans that word's clip: the file stays on disk under the old name, the app
  computes a new name, finds nothing, and the word goes quiet. That has happened
  three times in this work — asieloton, padepad, tuģas — and each time the fix
  looked harmless right up until the word stopped speaking.

  It is only a problem when the recording is wrong too. A re-spelling usually
  corrects how a word is WRITTEN, while the recording of how it SOUNDS is
  unaffected, so the clip should follow the word to its new key rather than be
  re-made. That also preserves the original voice, which matters here: the
  library is Lekha and anything re-rendered now is a different voice.

  Moves the file, rewrites AUDIOKEYS (add the new key, drop the old), and
  rewrites every occurrence of the text in index.html.

  Run: node scripts/respell.mjs "<old latin>" "<new latin>"
       node scripts/respell.mjs --check "<latin>"
*/

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "public", "brahui", "index.html");
const AUDIO = path.join(ROOT, "public", "brahui", "audio");

function engine(html) {
  const slice = (a, b) => {
    const i = html.indexOf(a), j = html.indexOf(b, i);
    if (i < 0 || j < 0) throw new Error(`missing marker ${a}`);
    return html.slice(i, j);
  };
  const coll = /const AUDIOCOLLISIONKEYS=(\[[^\]]*\]);/.exec(html);
  const src = [
    slice("const C = {", "/* ---------- 2. ENGINE ---------- */"),
    slice("function tokenize(word){", "/* opts.sukun"),
    `const AUDIOCOLLISIONSET=new Set(${coll[1]});`,
    slice("function audioKey(s){", "\nlet clip=null;"),
  ].join("\n");
  const box = {};
  vm.createContext(box);
  vm.runInContext(src, box);
  return box;
}

const args = process.argv.slice(2);
let html = fs.readFileSync(HTML, "utf8");
const { audioKey } = engine(html);

if (args[0] === "--check") {
  const k = audioKey(args[1].trim());
  console.log(`${args[1]}\n  key   ${k}\n  clip  ${fs.existsSync(path.join(AUDIO, k + ".m4a")) ? "present" : "MISSING"}`);
  process.exit(0);
}

const [oldText, newText] = args;
if (!oldText || !newText) {
  console.error('usage: node scripts/respell.mjs "<old latin>" "<new latin>"');
  process.exit(1);
}

const oldKey = audioKey(oldText.trim());
const newKey = audioKey(newText.trim());
const oldFile = path.join(AUDIO, oldKey + ".m4a");
const newFile = path.join(AUDIO, newKey + ".m4a");

console.log(`  ${oldText}\n    -> ${newText}`);
console.log(`  key ${oldKey} -> ${newKey}`);

const occurrences = html.split(oldText).length - 1;
if (!occurrences) {
  console.error(`\n"${oldText}" does not appear in index.html — nothing changed`);
  process.exit(1);
}

/* The recording moves with the word. It is the same audio: only the name the
   app computes for it has changed. */
let moved = "no clip to move";
if (fs.existsSync(oldFile)) {
  fs.renameSync(oldFile, newFile);
  moved = `${oldKey}.m4a -> ${newKey}.m4a`;
}

html = html.split(oldText).join(newText);

const m = /const AUDIOKEYS=(\[[^\]]*\]);/.exec(html);
if (!m) throw new Error("AUDIOKEYS not found");
const keys = new Set(JSON.parse(m[1]));
const had = keys.delete(oldKey);
if (fs.existsSync(newFile)) keys.add(newKey);
html = html.replace(m[0], "const AUDIOKEYS=" + JSON.stringify([...keys]) + ";");

fs.writeFileSync(HTML, html);

console.log(`  text occurrences rewritten  ${occurrences}`);
console.log(`  clip                        ${moved}`);
console.log(`  AUDIOKEYS                   ${had ? "old key removed, " : ""}${fs.existsSync(newFile) ? "new key added" : "no key added (no clip)"}`);
