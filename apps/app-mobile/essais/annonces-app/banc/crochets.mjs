const DOUBLURES = new URL("../doublures/", import.meta.url);

const DOUBLES = {
  react: "react.mjs",
  "react-dom/client": "react-dom-client.mjs",
  "react-native": "react-native.mjs",
  "expo-router": "expo-router.mjs",
  "~/hooks/utiliser-services": "utiliser-services.mjs",
  "~/hooks/utiliser-session": "utiliser-session.mjs",
  "~/hooks/utiliser-profil": "utiliser-profil.mjs",
  "~/services/annonces-app-sans-compte": "annonces-app-sans-compte.mjs",
};

export async function resolve(specifier, context, next) {
  if (DOUBLES[specifier]) return { url: new URL(DOUBLES[specifier], DOUBLURES).href, shortCircuit: true };
  return next(specifier, context);
}
