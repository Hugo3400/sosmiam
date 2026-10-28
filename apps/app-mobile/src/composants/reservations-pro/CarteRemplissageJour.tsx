import { Text, View } from "react-native";

import type { ReglagesReservations } from "@sos-miam/commun/types/reglages-reservations";
import type { ReservationPro } from "@sos-miam/commun/types/reservation";
import { LigneRemplissageService } from "~/composants/reservations-pro/LigneRemplissageService";
import { TEXTES_REMPLISSAGE_PAR_LANGUE } from "~/contenus/textes-comptoir-reservations";
import { calculerRemplissageJour } from "~/fonctions/reservations/calculer-remplissage-jour";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { reglages: ReglagesReservations; reservations: readonly ReservationPro[]; maintenantMs: number };

export function CarteRemplissageJour({ reglages, reservations, maintenantMs }: Props) {
  const T = utiliserTextes(TEXTES_REMPLISSAGE_PAR_LANGUE);
  const remplissage = calculerRemplissageJour(reglages, reservations, maintenantMs);
  const messages = { "sans-service": T.sansService, "jour-sans-resa": T.jourSansResa, finis: T.finis, ouvert: null };
  const message = messages[remplissage.etat];
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>
      {message ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(message)}</Text> : null}
      {remplissage.services
        .filter((s) => s.creneaux.length > 0)
        .map((s) => (
          <LigneRemplissageService key={`${s.service.premier}-${s.service.dernier}`} remplissage={s} services={reglages.services} />
        ))}
    </View>
  );
}
