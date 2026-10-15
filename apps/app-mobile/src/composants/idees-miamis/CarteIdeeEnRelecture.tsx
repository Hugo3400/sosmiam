import { Text, View } from "react-native";

import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function CarteIdeeEnRelecture() {
  return (
    <View accessible className="flex-row items-start gap-3 rounded-carte border-2 border-dashed border-gris/50 bg-white/70 p-4">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
        🔎
      </Text>
      <View className="flex-1 gap-1">
        <Text className="font-texte-gras text-base text-encre">{TEXTES_IDEES.enRelectureTitre}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_IDEES.enRelecture)}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_IDEES.commentairesFermes)}</Text>
      </View>
    </View>
  );
}
