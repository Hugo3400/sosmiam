import { Stack } from "expo-router";

/**
 * Écrans de Potes ouverts depuis l'onglet : sortie, nouvelle sortie, ajouter un pote, profil d'un pote, liste partagée,
 * et le chat entre potes : messages (tes conversations), discussion (une conversation privée ou de groupe) et nouveau groupe.
 */
export default function MiseEnPagePotes() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
