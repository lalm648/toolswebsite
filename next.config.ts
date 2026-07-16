import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @jsquash/avif ships its encoder as a WebAssembly module. Turbopack currently
  // stalls building the emscripten glue, so the app is built with webpack
  // (see the `--webpack` flag in package.json scripts) with async WASM enabled.
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
