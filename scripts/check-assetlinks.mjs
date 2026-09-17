/*
  Verifies a deployed assetlinks.json the way Android actually reads it, so a
  broken link is found before an unverified app is.

  Android is strict in ways a browser is not: it follows no redirects, it wants
  application/json, and it matches the fingerprint exactly. A host that redirects
  the apex to www, or serves the file as text/plain, or answers the SPA's 200
  fallback page instead of a 404, all look fine in a browser and all fail here.

  Usage: node scripts/check-assetlinks.mjs <package-id> [origin]
*/
const [pkg, origin = "https://www.webutilia.com"] = process.argv.slice(2);
if (!pkg) {
  console.error("usage: node scripts/check-assetlinks.mjs <package-id> [origin]");
  process.exit(1);
}

const url = new URL("/.well-known/assetlinks.json", origin).href;
const problems = [];
const notes = [];

let res;
try {
  res = await fetch(url, { redirect: "manual" });
} catch (err) {
  console.error(`could not reach ${url}\n  ${err.message}`);
  process.exit(1);
}

notes.push(`GET ${url} -> ${res.status}`);

if (res.status >= 300 && res.status < 400) {
  problems.push(`redirects to ${res.headers.get("location")} — Android does not follow redirects here`);
}
if (res.status !== 200) {
  problems.push(`status ${res.status}, want 200`);
}

const type = res.headers.get("content-type") || "(none)";
notes.push(`content-type: ${type}`);
if (!/application\/json/i.test(type)) {
  problems.push(`content-type is ${type}, want application/json`);
}

let body = null;
if (res.status === 200) {
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    problems.push("body is not valid JSON (a 200 HTML fallback page is the usual cause)");
  }
}

if (body) {
  if (!Array.isArray(body)) {
    problems.push("top level must be an array of statements");
  } else {
    const match = body.find(
      (s) => s?.target?.namespace === "android_app" && s?.target?.package_name === pkg
    );
    if (!match) {
      const found = body.map((s) => s?.target?.package_name).filter(Boolean);
      problems.push(
        `no statement for ${pkg}` + (found.length ? ` (found: ${found.join(", ")})` : "")
      );
    } else {
      const rel = match.relation || [];
      if (!rel.includes("delegate_permission/common.handle_all_urls")) {
        problems.push(`relation must include delegate_permission/common.handle_all_urls, got ${JSON.stringify(rel)}`);
      }
      const prints = match.target.sha256_cert_fingerprints || [];
      if (prints.length === 0) problems.push("no sha256_cert_fingerprints listed");
      for (const p of prints) {
        if (!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/i.test(p)) {
          problems.push(`malformed fingerprint: ${p}`);
        } else {
          notes.push(`fingerprint: ${p}`);
        }
      }
    }
  }
}

for (const n of notes) console.log("  " + n);
if (problems.length) {
  console.log("\nFAIL");
  for (const p of problems) console.log("  - " + p);
  console.log(
    "\nGoogle's own checker, which is what Chrome consults:\n" +
      `  https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=${encodeURIComponent(origin)}&relation=delegate_permission/common.handle_all_urls`
  );
  process.exit(1);
}
console.log("\nOK — Android should verify this app against this domain.");
