import { Stack } from "expo-router";

/** Mode ambassadeur : ses onglets, puis ses écrans à part (une mission, une relecture), posés sur les onglets perso. */
export default function MiseEnPageAmbassadeur() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
