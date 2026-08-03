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
};

export default nextConfig;
