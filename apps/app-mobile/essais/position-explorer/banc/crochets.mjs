import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const DOUBLURES = new URL("../doublures/", import.meta.url);
const { transform } = createRequire(new URL("../../../package.json", import.meta.url))("sucrase");

const DOUBLES = {
  react: "react.mjs",
  "react/jsx-runtime": "jsx-runtime.mjs",
  "react-dom/client": "react-dom-client.mjs",
  "react-native": "react-native.mjs",
  "~/hooks/utiliser-profil": "utiliser-profil.mjs",
  "~/hooks/utiliser-lieux": "utiliser-lieux.mjs",
  "~/fonctions/geo/lire-position-telephone": "lire-position-telephone.mjs",
  "~/hooks/utiliser-activite": "effacements.mjs",
  "~/hooks/utiliser-appareil-push": "effacements.mjs",
  "~/hooks/utiliser-communaute": "effacements.mjs",
  "~/hooks/utiliser-conversations": "effacements.mjs",
  "~/hooks/utiliser-notifications": "effacements.mjs",
  "~/hooks/utiliser-suivis-personnes": "effacements.mjs",
  "~/stockage/envies-miamis": "effacements.mjs",
  "~/stockage/mode-app": "effacements.mjs",
};

export async function resolve(specifier, context, next) {
  if (DOUBLES[specifier]) return { url: new URL(DOUBLES[specifier], DOUBLURES).href, shortCircuit: true };
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (!url.startsWith("file:") || !url.endsWith(".tsx")) return next(url, context);
  const chemin = fileURLToPath(url);
  const { code } = transform(readFileSync(chemin, "utf8"), { transforms: ["typescript", "jsx"], jsxRuntime: "automatic", production: true, filePath: chemin });
  return { format: "module", source: code, shortCircuit: true };
}
