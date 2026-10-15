import { useRouter } from "expo-router";

import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { resumerReservationsComptoir } from "~/fonctions/reservations/resumer-reservations-comptoir";

type Props = {
  aRepondre: number;
  arrivees: readonly ReservationPro[];
};

export function CarteReservationsComptoir({ aRepondre, arrivees }: Props) {
  const router = useRouter();
  return (
    <LigneMonLieu
      emoji="📅"
      titre={TEXTES_RESERVATIONS_PRO.entreeTitre}
      detail={resumerReservationsComptoir(aRepondre, arrivees)}
      onPress={() => router.push("/pro/reservations")}
    />
  );
}
