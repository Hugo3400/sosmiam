import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { EtiquetteStatutReservation } from "~/composants/reservations/EtiquetteStatutReservation";
import { SECTION_RESERVATIONS_SCAN } from "~/contenus/textes-mes-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { decrireStatutReservation } from "~/fonctions/reservations/decrire-statut-reservation";
import { doitPrevenirAlcoolReservation } from "~/fonctions/reservations/doit-prevenir-alcool-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import couleurs from "~/theme/couleurs";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  onPress: () => void;
};

export function ApercuReservation({ reservation, maintenantMs, onPress }: Props) {
  const creneau = decrireCreneauReservation(reservation.creneau, maintenantMs);
  const etiquette = decrireStatutReservation(reservation, maintenantMs);
  const personnes = ecrireNombrePersonnes(reservation.personnes);
  const alcool = doitPrevenirAlcoolReservation(reservation.lieu.type, reservation.message);
  const libelle = `${reservation.lieu.nom}, ${creneau.lu}, ${personnes}. ${etiquette.lu}${alcool ? `. ${MESSAGE_SANITAIRE_ALCOOL}` : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={SECTION_RESERVATIONS_SCAN.indiceLigne}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-3.5 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-creme">
        <Text allowFontScaling={false} style={{ fontSize: 20, lineHeight: 26 }}>
          {reservation.lieu.emoji}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
          {reservation.lieu.nom}
        </Text>
        <Text className="font-texte text-[13px] text-gris">{`${creneau.court} · ${personnes}`}</Text>
        <View className="flex-row">
          <EtiquetteStatutReservation etiquette={etiquette} />
        </View>
        {alcool ? <MentionPrevention variante="courte" /> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
