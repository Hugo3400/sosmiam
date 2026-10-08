import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Petit bandeau honnête des sorties : les potes sont des exemples qui votent et répondent tout seuls, en attendant les comptes. */
export function BandeauDemoSortie() {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl border-2 border-dashed border-encre/30 bg-jaune-clair px-3 py-2.5">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-base">
        🧪
      </Text>
      <Text className="flex-1 font-texte-moyen text-[13px] leading-[18px] text-encre">
        {lierPonctuation("Potes d'exemple : tes vrais potes arriveront avec les comptes. En attendant, ceux-là votent et répondent tout seuls.")}
      </Text>
    </View>
  );
}
