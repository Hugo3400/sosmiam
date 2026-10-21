import { Text, View } from "react-native";

import { Jauge } from "~/composants/interface/Jauge";
import type { RemplissageCreneau } from "~/fonctions/reservations/calculer-remplissage-jour";
import { decrireRemplissageCreneau } from "~/fonctions/reservations/decrire-remplissage-creneau";

type Props = { creneau: RemplissageCreneau };

export function LigneRemplissageCreneau({ creneau }: Props) {
  const decrit = decrireRemplissageCreneau(creneau);
  return (
    <View accessible accessibilityLabel={decrit.lu} className="gap-1 py-1.5">
      <View className="flex-row items-center gap-3">
        <Text className="w-14 font-texte-gras text-[15px] text-encre">{decrit.heure}</Text>
        <Jauge avancee={decrit.avancee} className="flex-1" />
        <Text className={`w-28 text-right font-texte-semi text-[13px] ${decrit.complet ? "text-rouge-texte" : "text-encre"}`}>{decrit.places}</Text>
      </View>
      {decrit.demandes ? <Text className="pl-[68px] font-texte text-[12px] text-gris">{decrit.demandes}</Text> : null}
    </View>
  );
}
