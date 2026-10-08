// Metro (le serveur qui assemble l'app) avec NativeWind, qui lit les styles de src/global.css.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: "./src/global.css" });
