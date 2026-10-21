import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { TEXTES_RACCOURCIS } from "~/contenus/textes-profil";
import { ENTREE_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { listerReservationsEnCours } from "~/fonctions/reservations/lister-reservations-en-cours";
import { resumerMesReservations } from "~/fonctions/reservations/resumer-mes-reservations";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export function EntreeReservations() {
  const router = useRouter();
  const { reservations, lecturesReservations } = utiliserVisites();
  const { maintenantMs } = utiliserHorlogeMinute();
  const detail =
    lecturesReservations === 0
      ? ENTREE_MES_RESERVATIONS.pasEncoreLues
      : reservations.length === 0
        ? TEXTES_RACCOURCIS.pasDeTable
        : listerReservationsEnCours(reservations, maintenantMs).length === 0
          ? TEXTES_RACCOURCIS.rienDePrevu
          : resumerMesReservations(reservations, maintenantMs);

  return (
    <TuileRaccourci
      emoji="📅"
      titre={ENTREE_MES_RESERVATIONS.titre}
      detail={detail}
      indice={ENTREE_MES_RESERVATIONS.indice}
      onPress={() => router.push("/reservations")}
    />
  );
}
