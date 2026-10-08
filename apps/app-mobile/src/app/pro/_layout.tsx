import { Stack } from "expo-router";

/** Mode pro (équipe d'un lieu) : ses onglets, puis ses écrans à part (QR plein écran, fidélité, kit…), posés sur les onglets perso. */
export default function MiseEnPagePro() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
