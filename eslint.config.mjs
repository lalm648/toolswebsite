import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored FFmpeg WebAssembly loader copied from @ffmpeg/core.
    "public/ffmpeg/**",
    // The Brahui learning app: a separate repository checked out inside this one,
    // written as CommonJS Node scripts with its own conventions and its own test
    // suites. It is gitignored here, and only its build output ships, below.
    "Brahui-to-EN-URDU-Dictionary/**",
    // That build output is a single 2.3 MB generated document.
    "public/brahui/**",
  ]),
]);

export default eslintConfig;
