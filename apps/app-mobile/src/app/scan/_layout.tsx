import { Stack } from "expo-router";

/** Écrans du Scan ouverts depuis l'onglet (scanner du comptoir, « Tu es chez qui ? ») : en plein écran, par-dessus les onglets. */
export default function MiseEnPageScan() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
