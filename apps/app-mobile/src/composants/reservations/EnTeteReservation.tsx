import { Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { EtiquetteStatutReservation } from "~/composants/reservations/EtiquetteStatutReservation";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireHorairesSecours } from "~/fonctions/reservations/decrire-horaires-secours";
import { decrireStatutReservation } from "~/fonctions/reservations/decrire-statut-reservation";
import { lireHorairesReservation } from "~/fonctions/reservations/lire-horaires-reservation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  enRetrait: boolean;
};

export function EnTeteReservation({ reservation, maintenantMs, enRetrait }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  const { lieu } = reservation;
  const creneau = decrireCreneauReservation(lireHorairesReservation(reservation).affiche, maintenantMs, langue);
  const secours = decrireHorairesSecours(reservation, langue);
  const personnes = ecrireNombrePersonnesLangue(reservation.personnes, langue);
  const etiquette = decrireStatutReservation(reservation, maintenantMs, langue);
  const ou = lieu.ville ? T.ouEtVille(lieu.nom, lieu.ville) : lieu.nom;
  const libelle = [ou, `${creneau.lu}, ${personnes}`, ...(secours ? [secours.lu] : []), etiquette.lu].join(". ");

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
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lieu.ville ? `${lieu.ville} · ${personnes}` : personnes}</Text>
        <Text className={`mt-1 font-texte-semi text-[15px] leading-5 ${enRetrait ? "text-gris" : "text-encre"}`}>{creneau.court}</Text>
        {secours ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{secours.texte}</Text> : null}
        <View className="mt-1.5 flex-row flex-wrap gap-1.5">
          <EtiquetteStatutReservation etiquette={etiquette} />
        </View>
      </View>
    </View>
  );
}
