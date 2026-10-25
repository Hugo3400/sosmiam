// Metro (le serveur qui assemble l'app) avec NativeWind, qui lit les styles de src/global.css.
// inlineRem 16 : 1 rem = 16 points, comme sur le web (NativeWind compte 14 par défaut sur téléphone).
// Le code commun (packages/commun) est surveillé aussi : il est importé via l'alias « @sos-miam/commun/… » (tsconfig.json).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../../packages/commun")];

const sansDemo = process.env.NODE_ENV === "production" && process.env.EXPO_PUBLIC_DEMO_VISITES !== "1";
const remplacementsSansDemo = new Map([
  [path.resolve(__dirname, "src/contenus/publications-exemples.ts"), path.resolve(__dirname, "src/contenus/publications-exemples-production.ts")],
  [path.resolve(__dirname, "src/contenus/photos-avis-demo.ts"), path.resolve(__dirname, "src/contenus/photos-avis-demo-production.ts")],
  [path.resolve(__dirname, "src/contenus/photos-chat-demo.ts"), path.resolve(__dirname, "src/contenus/photos-chat-demo-production.ts")],
]);
const resoudreAvant = config.resolver.resolveRequest;
config.resolver.resolveRequest = (contexte, nom, plateforme) => {
  const resolu = (resoudreAvant ?? contexte.resolveRequest)(contexte, nom, plateforme);
  const remplacant = sansDemo && resolu.type === "sourceFile" ? remplacementsSansDemo.get(resolu.filePath) : undefined;
  return remplacant ? { type: "sourceFile", filePath: remplacant } : resolu;
};

module.exports = withNativeWind(config, { input: "./src/global.css", inlineRem: 16 });
