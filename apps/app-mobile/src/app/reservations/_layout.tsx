import { Stack } from "expo-router";

/** Écrans de tes réservations : chacun a son propre bouton retour. */
export default function MiseEnPageReservations() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
