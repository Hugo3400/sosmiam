import { Text, View } from "react-native";

import type { NomServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";

type Props = {
  nom: NomServiceReservation;
  plage: { premier: string; dernier: string } | null;
};

export function EnTeteGroupeCreneaux({ nom, plage }: Props) {
  const { emoji, titre } = ecrireNomService(nom);
  const lu = plage && plage.premier !== plage.dernier ? `${titre}, de ${formaterHeure(plage.premier)} à ${formaterHeure(plage.dernier)}` : titre;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={lu} className="flex-row flex-wrap items-center gap-1.5">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-sm">
        {emoji}
      </Text>
      <Text className="font-texte-semi text-sm text-gris">{titre}</Text>
      {plage && plage.premier !== plage.dernier ? <Text className="font-texte text-[13px] text-gris">{`· ${formaterHeure(plage.premier)} – ${formaterHeure(plage.dernier)}`}</Text> : null}
    </View>
  );
}
