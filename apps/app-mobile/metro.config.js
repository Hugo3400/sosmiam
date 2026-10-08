// Metro (le serveur qui assemble l'app) avec NativeWind, qui lit les styles de src/global.css.
// Le code commun (packages/commun) est surveillé aussi : il est importé via l'alias « @sos-miam/commun/… » (tsconfig.json).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../../packages/commun")];

module.exports = withNativeWind(config, { input: "./src/global.css" });
