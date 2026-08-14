/**
 * Copy the built Brahui learning app into public/ so the site can serve it.
 *
 * The app lives in its own git repository (Brahui-to-EN-URDU-Dictionary/) because
 * that is where its generator, its 3.8 MB source lexicon and its three test suites
 * live. None of that belongs in this repository, and a nested .git cannot be
 * committed here as anything but a broken gitlink — so the source tree is ignored
 * and only the two build outputs are copied in and committed:
 *
 *   brahui-dictionary.html    ->  public/brahui/index.html
 *   lexdetail.<hash>.json     ->  public/brahui/
 *   audio/*.m4a               ->  public/brahui/audio/
 *
 * The sidecar holds the senses and example sentences — 467 KB gzipped, three
 * quarters of what the page used to weigh — and the app fetches it only when the
 * first word is opened. Its name carries a hash of its contents, so old builds
 * must be swept rather than left to accumulate, and it is safe to cache forever.
 *
 * Rebuild the source first when the lexicon or the app shell changes:
 *
 *   cd Brahui-to-EN-URDU-Dictionary
 *   BASE_URL=https://www.webutilia.com PAGE_PATH=tools/dictionary/brahui-dictionary \
 *     node build-single.js
 *   cd .. && npm run sync:brahui
 *
 * BASE_URL and PAGE_PATH matter: without them the app writes a canonical tag
 * pointing at example.com. They are the reason this is a copy step and not a
 * symlink — the file that ships has to be the one built for this domain.
 */
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(projectRoot, "Brahui-to-EN-URDU-Dictionary");
const target = join(projectRoot, "public", "brahui");

const sourceHtml = join(source, "brahui-dictionary.html");
const sourceAudio = join(source, "audio");
const targetHtml = join(target, "index.html");
const targetAudio = join(target, "audio");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(sourceHtml))) {
    console.error(
      `Cannot sync: ${sourceHtml} is missing.\n` +
        "The Brahui app is a separate repository that is not vendored here. Clone it\n" +
        "into Brahui-to-EN-URDU-Dictionary/ and run its build before syncing.",
    );
    process.exitCode = 1;
    return;
  }

  await mkdir(target, { recursive: true });
  await cp(sourceHtml, targetHtml);

  const html = await stat(targetHtml);
  console.log(`index.html    ${(html.size / 1024).toFixed(0)} KB`);

  /*
    The detail sidecar. Its filename is a content hash, so the name the freshly
    built HTML points at is the only one worth keeping — anything else is a
    previous build that nothing references. Sweeping them keeps the deployment
    from growing by 1.3 MB every time the lexicon is rebuilt.
  */
  const referenced = (await readFile(targetHtml, "utf8")).match(
    /<div id="lexdetail" data-src="([^"]+)"/,
  )?.[1];

  if (!referenced) {
    console.error(
      "The app does not reference a detail sidecar. Rebuild it with build-single.js.",
    );
    process.exitCode = 1;
    return;
  }

  for (const name of await readdir(target)) {
    if (/^lexdetail\.[0-9a-f]+\.json$/.test(name) && name !== referenced) {
      await rm(join(target, name));
      console.log(`swept         ${name}`);
    }
  }

  if (!(await exists(join(source, referenced)))) {
    console.error(
      `The app points at ${referenced}, which is missing from the source folder.\n` +
        "Run build-single.js so the HTML and its sidecar are built together.",
    );
    process.exitCode = 1;
    return;
  }

  await cp(join(source, referenced), join(target, referenced));
  const detail = await stat(join(target, referenced));
  console.log(
    `${referenced}  ${(detail.size / 1024).toFixed(0)} KB (deferred until a word is opened)`,
  );

  if (await exists(sourceAudio)) {
    // Removed rather than merged: a clip that the current build no longer
    // references is dead weight in the deployment, and AUDIOKEYS in the HTML is
    // the only list that decides which ones are real.
    await rm(targetAudio, { recursive: true, force: true });
    await cp(sourceAudio, targetAudio, { recursive: true });
    const clips = (await readdir(targetAudio)).filter((name) => name.endsWith(".m4a"));
    console.log(`audio/        ${clips.length} clips`);
  } else {
    console.warn("audio/        missing at the source; speech falls back to the device voice");
  }

  if (!html.size) {
    console.error("The copied app is empty.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nSynced to public/brahui/ — served at /tools/dictionary/brahui-dictionary`);
}

await main();
