import { Stack } from "expo-router";

/** Écrans de réglages, ouverts depuis le profil (⚙️) : chacun a son propre bouton retour. */
export default function MiseEnPageReglages() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
