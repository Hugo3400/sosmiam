import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { ENTREE_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { resumerMesReservations } from "~/fonctions/reservations/resumer-mes-reservations";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export function EntreeReservations() {
  const router = useRouter();
  const { reservations, lecturesReservations } = utiliserVisites();
  const { maintenantMs } = utiliserHorlogeMinute();
  const detail = lecturesReservations > 0 ? resumerMesReservations(reservations, maintenantMs) : ENTREE_MES_RESERVATIONS.pasEncoreLues;

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
