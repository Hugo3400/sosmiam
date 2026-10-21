import { Stack } from "expo-router";

import { FournisseurReservationsPro } from "~/composants/reservations-pro/FournisseurReservationsPro";
import { utiliserModes } from "~/hooks/utiliser-modes";

/** Mode pro (équipe d'un lieu) : ses onglets, puis ses écrans à part (QR plein écran, fidélité, kit…), posés sur les onglets perso. */
export default function MiseEnPagePro() {
  const { lieuPro } = utiliserModes();
  return (
    <FournisseurReservationsPro lieuId={lieuPro?.id ?? null}>
      <Stack screenOptions={{ headerShown: false }} />
    </FournisseurReservationsPro>
  );
}
