import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Another package-lock.json can exist above this project on local machines.
  // Keep tracing scoped to this app instead of letting Next infer the parent folder.
  outputFileTracingRoot: process.cwd(),
  // @jsquash/avif ships its encoder as a WebAssembly module. Turbopack currently
  // stalls building the emscripten glue, so the app is built with webpack
  // (see the `--webpack` flag in package.json scripts) with async WASM enabled.
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  // The app served no security headers at all. These are the ones that cannot break
  // a browser-only tool site. A full Content-Security-Policy is deliberately left out:
  // the layout ships inline scripts (theme boot, JSON-LD) and the media tools compile
  // WebAssembly, so a CSP here needs per-request nonces plus 'wasm-unsafe-eval' and
  // should land as its own change rather than riding along with an analytics tag.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Third-party analytics must never be able to sniff a MIME type into
          // something executable.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Files users drop into the tools stay in the tab; do not let another
          // origin frame the page and drive it. SAMEORIGIN rather than DENY: the
          // stated intent is to block *another* origin, and DENY also blocks the
          // site framing itself, which is how /tools/dictionary/brahui-dictionary
          // hosts the self-contained Brahui app from public/brahui/index.html.
          // Cross-origin framing is still refused.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Send the origin to cross-origin requests (Ahrefs included) but never the
          // full path, which can contain user input.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No tool needs these devices; deny them for the page and every embed.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // HTTPS only, including subdomains, once a browser has seen the site.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      /*
        Everything under public/ is served with `Cache-Control: public, max-age=0`,
        because Next cannot fingerprint files it did not build. For the Brahui app
        that is 2.3 MB of HTML and up to 1,000 audio clips all revalidating on every
        visit — cheap 304s, but a round trip each, and the clips are requested
        mid-playback where a round trip is audible.

        Deliberately NOT `immutable` on the audio. The filenames look
        content-addressed but are not: build-audio.js keys them `fnv1a(w.br)`, a
        hash of the *headword*, while the voice is a CLI flag. Re-recording with a
        different voice therefore rewrites the same filenames with different audio,
        and `immutable` would strand every returning visitor on the old recordings
        for a year. stale-while-revalidate gets the same instant replay while still
        picking up a re-record in the background, within the day.
      */
      {
        source: "/brahui/audio/:clip*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=2592000",
          },
        ],
      },
      /*
        The detail sidecar — senses and example sentences, fetched only when the
        first word is opened. This one IS genuinely content-addressed: build-single
        names it `lexdetail.<sha256-prefix>.json` from a hash of the JSON itself, so
        different contents can only ever arrive under a different URL. That is what
        the audio could not claim, and it is what makes `immutable` correct here —
        opening a word is a one-time cost per build, not per visit.
      */
      {
        source: "/brahui/:file(lexdetail\\..*\\.json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      /*
        The app document has a stable name, so it can never be cached hard either.
        A short max-age with a long stale window means a repeat visit paints from
        cache immediately and checks for a new build behind that, rather than
        blocking first paint on revalidating 2.3 MB.
      */
      {
        source: "/brahui/index.html",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
