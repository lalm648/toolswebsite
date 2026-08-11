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
          // origin frame the page and drive it.
          { key: "X-Frame-Options", value: "DENY" },
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
    ];
  },
};

export default nextConfig;
