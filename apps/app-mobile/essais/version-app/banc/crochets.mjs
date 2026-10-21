const DOUBLURES = new URL("../doublures/", import.meta.url);

const DOUBLES = {
  "expo-constants": "expo-constants.mjs",
  "~/services/versions-app-serveur": "versions-app-serveur.mjs",
};

export async function resolve(specifier, context, next) {
  if (DOUBLES[specifier]) return { url: new URL(DOUBLES[specifier], DOUBLURES).href, shortCircuit: true };
  return next(specifier, context);
}
