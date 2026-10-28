import { Text, View } from "react-native";

import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function CarteIdeeEnRelecture() {
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  return (
    <View accessible className="flex-row items-start gap-3 rounded-carte border-2 border-dashed border-gris/50 bg-carte/70 p-4">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
        🔎
      </Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre">{T.enRelectureTitre}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.enRelecture)}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.commentairesFermes)}</Text>
      </View>
    </View>
  );
}
