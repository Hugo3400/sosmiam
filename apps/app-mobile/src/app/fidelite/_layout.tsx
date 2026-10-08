import { Stack } from "expo-router";

/** Écrans des cartes de fidélité : chacun a son propre bouton retour. */
export default function MiseEnPageFidelite() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
