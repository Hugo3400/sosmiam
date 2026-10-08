import { Stack } from "expo-router";

/** Écrans de Potes ouverts depuis l'onglet : sortie, nouvelle sortie, ajouter un pote, profil d'un pote, liste partagée. */
export default function MiseEnPagePotes() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
