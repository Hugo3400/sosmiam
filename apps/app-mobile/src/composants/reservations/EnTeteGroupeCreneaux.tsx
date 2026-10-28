import { Text, View } from "react-native";

import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { NomServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { CARTE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nom: NomServiceReservation;
  plage: { premier: string; dernier: string } | null;
};

const lireHeure = (heure: string, langue: Langue) => {
  const [h, m] = heure.split(":").map(Number);
  return formaterHeureLangue(h, m, langue);
};

export function EnTeteGroupeCreneaux({ nom, plage }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(CARTE_RESERVATION_PAR_LANGUE);
  const { emoji, titre } = ecrireNomService(nom, langue);
  const lu = plage && plage.premier !== plage.dernier ? T.plageLu(titre, lireHeure(plage.premier, langue), lireHeure(plage.dernier, langue)) : titre;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={lu} className="flex-row flex-wrap items-center gap-1.5">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-sm">
        {emoji}
      </Text>
      <Text className="font-texte-semi text-sm text-gris">{titre}</Text>
      {plage && plage.premier !== plage.dernier ? <Text className="font-texte text-[13px] text-gris">{T.plage(lireHeure(plage.premier, langue), lireHeure(plage.dernier, langue))}</Text> : null}
    </View>
  );
}
