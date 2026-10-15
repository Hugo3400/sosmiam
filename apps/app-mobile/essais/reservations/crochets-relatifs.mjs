import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const estUnFichier = (url) => {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, next) {
  if (/^\.{1,2}\//.test(specifier) && context.parentURL?.startsWith("file:") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    for (const extension of [".ts", ".tsx"]) {
      const url = new URL(specifier + extension, context.parentURL);
      if (estUnFichier(url)) return { url: url.href, shortCircuit: true };
    }
  }
  return next(specifier, context);
}
