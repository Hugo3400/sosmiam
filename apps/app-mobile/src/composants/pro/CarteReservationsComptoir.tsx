import { useRouter } from "expo-router";

import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { TEXTES_RESERVATIONS_PRO_PAR_LANGUE } from "~/contenus/textes-reservations-pro";
import { resumerReservationsComptoir } from "~/fonctions/reservations/resumer-reservations-comptoir";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  aRepondre: number;
  arrivees: readonly ReservationPro[];
};

export function CarteReservationsComptoir({ aRepondre, arrivees }: Props) {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_RESERVATIONS_PRO_PAR_LANGUE);
  return (
    <LigneMonLieu
      emoji="📅"
      titre={T.entreeTitre}
      detail={resumerReservationsComptoir(aRepondre, arrivees, langue)}
      onPress={() => router.push("/pro/reservations")}
    />
  );
}
