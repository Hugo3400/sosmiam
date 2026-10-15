import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { REGLES_SORTIE_MIAMIS, TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function ReglesSortieMiamis() {
  return (
    <View className="gap-2.5 rounded-carte border-2 border-ligne bg-white px-4 py-3.5">
      <Text accessibilityRole="header" className="font-texte-gras text-[15px] text-encre">
        {TEXTES_SORTIE_MIAMIS.reglesTitre}
      </Text>
      {REGLES_SORTIE_MIAMIS.map((regle) => (
        <View key={regle} className="flex-row items-start gap-2.5">
          <Ionicons name="checkmark" size={16} color="#1D5C36" style={{ marginTop: 2 }} />
          <Text className="flex-1 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(regle)}</Text>
        </View>
      ))}
    </View>
  );
}
