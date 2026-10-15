import { useRouter } from "expo-router";
import { View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { ApercuReservation } from "~/composants/reservations/ApercuReservation";
import { SectionVideScan } from "~/composants/scan/SectionVideScan";
import { TitreSectionScan } from "~/composants/scan/TitreSectionScan";
import { SECTION_RESERVATIONS_SCAN } from "~/contenus/textes-mes-reservations";
import { listerReservationsEnCours } from "~/fonctions/reservations/lister-reservations-en-cours";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";

type Props = {
  reservations: readonly Reservation[];
};

const RESERVATIONS_AFFICHEES = 2;

export function SectionReservationsScan({ reservations }: Props) {
  const router = useRouter();
  const { maintenantMs } = utiliserHorlogeMinute();
  const enCours = listerReservationsEnCours(reservations, maintenantMs);
  const ouvrir = () => router.push("/reservations");

  return (
    <View className="gap-3">
      <TitreSectionScan
        titre={SECTION_RESERVATIONS_SCAN.titre}
        libelleLu={`${SECTION_RESERVATIONS_SCAN.titre}, ${enCours.length} à venir`}
        onToutVoir={reservations.length > 0 ? ouvrir : undefined}
      />
      {enCours.length > 0 ? (
        <View className="gap-2">
          {enCours.slice(0, RESERVATIONS_AFFICHEES).map((reservation) => (
            <ApercuReservation key={reservation.id} reservation={reservation} maintenantMs={maintenantMs} onPress={ouvrir} />
          ))}
        </View>
      ) : (
        <SectionVideScan emoji="📅" texte={SECTION_RESERVATIONS_SCAN.vide} />
      )}
    </View>
  );
}
