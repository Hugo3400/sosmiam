import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { ENTREE_MES_RESERVATIONS_PAR_LANGUE } from "~/contenus/textes-mes-reservations";
import { TEXTES_RACCOURCIS_PAR_LANGUE } from "~/contenus/textes-profil";
import { listerReservationsEnCours } from "~/fonctions/reservations/lister-reservations-en-cours";
import { resumerMesReservations } from "~/fonctions/reservations/resumer-mes-reservations";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export function EntreeReservations() {
  const router = useRouter();
  const { source, reservations, lecturesReservations } = utiliserVisites();
  const { maintenantMs } = utiliserHorlogeMinute();
  const { langue } = utiliserLangue();
  const entree = utiliserTextes(ENTREE_MES_RESERVATIONS_PAR_LANGUE);
  const raccourcis = utiliserTextes(TEXTES_RACCOURCIS_PAR_LANGUE);
  const detail =
    lecturesReservations === 0 || source === "indisponible"
      ? entree.pasEncoreLues
      : reservations.length === 0
        ? raccourcis.pasDeTable
        : listerReservationsEnCours(reservations, maintenantMs).length === 0
          ? raccourcis.rienDePrevu
          : resumerMesReservations(reservations, maintenantMs, langue);

  return (
    <TuileRaccourci
      emoji="📅"
      titre={entree.titre}
      detail={detail}
      indice={entree.indice}
      onPress={() => router.push("/reservations")}
    />
  );
}
