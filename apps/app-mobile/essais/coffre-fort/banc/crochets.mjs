const DOUBLURES = new URL("../doublures/", import.meta.url);
const STOCKAGE = new URL("../../../src/stockage/", import.meta.url);

const DOUBLES = {
  "expo-secure-store": "expo-secure-store.mjs",
  "@react-native-async-storage/async-storage": "async-storage.mjs",
  "react-native": "react-native.mjs",
};

export async function resolve(specifier, context, next) {
  if (DOUBLES[specifier]) return { url: new URL(DOUBLES[specifier], DOUBLURES).href, shortCircuit: true };
  const remplace = (process.env.ESSAIS_SYNCHRO_REMPLACER ?? "").includes(`${specifier}=`);
  if (specifier === "~/stockage/profil-local" && !remplace) return { url: new URL("profil-local.ts", STOCKAGE).href, shortCircuit: true };
  return next(specifier, context);
}
