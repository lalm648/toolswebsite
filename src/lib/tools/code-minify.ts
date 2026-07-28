import { minify as minifyWithCsso } from "csso";
import { minify as minifyWithTerser } from "terser";

export async function minifyJavascript(
  source: string,
  options: { mangle: boolean },
) {
  const result = await minifyWithTerser(source, {
    compress: {
      passes: 2,
    },
    mangle: options.mangle,
    format: {
      comments: /^!/,
      semicolons: true,
    },
  });
  if (!result.code) {
    throw new Error("The JavaScript parser did not produce output.");
  }
  return result.code;
}

export function minifyCss(
  source: string,
  options: { restructure: boolean },
) {
  const result = minifyWithCsso(source, {
    restructure: options.restructure,
    comments: "exclamation",
  });
  if (!result.css) {
    throw new Error("The CSS parser did not produce output.");
  }
  return result.css;
}
