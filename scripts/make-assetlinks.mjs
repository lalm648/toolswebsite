/*
  Writes public/.well-known/assetlinks.json — the file that tells Android the
  Play app and this domain are the same owner. Without it a Trusted Web Activity
  still runs, but Chrome cannot verify the link and shows its address bar across
  the top of the app, which is the usual "why does my TWA look like a browser"
  answer.

  It is generated rather than hand-written because the value that matters is a
  64-character fingerprint, and the one people reach for is usually the wrong
  one. Read this before running it:

    * If the app uses Play App Signing — the default for anything new — Google
      re-signs every release with a key it holds. The fingerprint Android checks
      at runtime is therefore PLAY'S, not the one on this machine. Find it in
      Play Console -> your app -> Test and release -> Setup -> App signing, under
      "App signing key certificate".

    * The upload key fingerprint is a different value, and internal-testing
      builds installed straight from a bundle may be verified against it. Pass
      both and the file lists both; Android accepts a match on any of them.

    * A self-signed release — no Play App Signing — uses the keystore's own
      fingerprint:
        keytool -list -v -keystore <file> -alias <alias>

  Usage:
    node scripts/make-assetlinks.mjs <package-id> <sha256> [<sha256> ...]

  Example:
    node scripts/make-assetlinks.mjs com.webutilia.brahui AA:BB:...:FF
*/
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [pkg, ...prints] = process.argv.slice(2);

if (!pkg || prints.length === 0) {
  console.error("usage: node scripts/make-assetlinks.mjs <package-id> <sha256> [<sha256> ...]");
  process.exit(1);
}
if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(pkg)) {
  console.error(`not a valid Android package id: ${pkg}`);
  process.exit(1);
}

// 32 colon-separated hex pairs. Catching this here beats discovering it as a
// silently unverified app three steps later.
const SHA256 = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i;
const cleaned = prints.map((p) => p.trim().toUpperCase());
for (const p of cleaned) {
  if (!SHA256.test(p)) {
    console.error(`not a SHA-256 fingerprint (want 32 colon-separated hex pairs):\n  ${p}`);
    process.exit(1);
  }
}

const statements = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: pkg,
      sha256_cert_fingerprints: cleaned,
    },
  },
];

const out = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  ".well-known"
);
await mkdir(out, { recursive: true });
const file = path.join(out, "assetlinks.json");
await writeFile(file, JSON.stringify(statements, null, 2) + "\n");

console.log(`wrote ${path.relative(process.cwd(), file)}`);
console.log(`  package     ${pkg}`);
for (const p of cleaned) console.log(`  fingerprint ${p}`);
console.log("\nIt must be served from https://www.webutilia.com/.well-known/assetlinks.json");
console.log("as application/json, with no redirect. Verify after deploying with:");
console.log(`  node scripts/check-assetlinks.mjs ${pkg}`);
