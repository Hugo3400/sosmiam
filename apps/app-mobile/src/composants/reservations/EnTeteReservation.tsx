import { Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { EtiquetteStatutReservation } from "~/composants/reservations/EtiquetteStatutReservation";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireStatutReservation } from "~/fonctions/reservations/decrire-statut-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  enRetrait: boolean;
};

const ETIQUETTE_DEMO = { texte: "🧪 Démo", lu: "Démo", ton: "doux" } as const;

export function EnTeteReservation({ reservation, maintenantMs, enRetrait }: Props) {
  const { lieu } = reservation;
  const creneau = decrireCreneauReservation(reservation.creneau, maintenantMs);
  const personnes = ecrireNombrePersonnes(reservation.personnes);
  const etiquette = decrireStatutReservation(reservation);
  const libelle = [`${lieu.nom}, à ${lieu.ville}`, `${creneau.lu}, ${personnes}`, etiquette.lu, ...(reservation.demo ? [ETIQUETTE_DEMO.lu] : [])].join(". ");

  return (
    <View accessible accessibilityLabel={libelle} className="flex-row items-start gap-3">
      <View
        className={`h-12 w-12 items-center justify-center rounded-full border-2 ${enRetrait ? "border-ligne bg-creme" : "border-encre bg-jaune-clair"}`}
      >
        <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }}>
          {lieu.emoji}
        </Text>
      </View>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className={`font-texte-gras text-base ${enRetrait ? "text-gris" : "text-encre"}`}>
          {lieu.nom}
        </Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{`${lieu.ville} · ${personnes}`}</Text>
        <Text className={`mt-1 font-texte-semi text-[15px] leading-5 ${enRetrait ? "text-gris" : "text-encre"}`}>{creneau.court}</Text>
        <View className="mt-1.5 flex-row flex-wrap gap-1.5">
          <EtiquetteStatutReservation etiquette={etiquette} />
          {reservation.demo ? <EtiquetteStatutReservation etiquette={ETIQUETTE_DEMO} /> : null}
        </View>
      </View>
    </View>
  );
}
