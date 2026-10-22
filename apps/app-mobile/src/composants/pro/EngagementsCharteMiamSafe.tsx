import { Text, View } from "react-native";

import { ENGAGEMENTS_CHARTE_MIAM_SAFE } from "@sos-miam/commun/contenus/charte-miam-safe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EngagementsCharteMiamSafe() {
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Ce que ton équipe s'engage à faire
      </Text>
      {ENGAGEMENTS_CHARTE_MIAM_SAFE.map((e, i) => (
        <View key={e.titre} accessible accessibilityLabel={`${i + 1}. ${e.titre}. ${e.texte}`} className="flex-row gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-jaune">
            <Text className="font-texte-gras text-base text-nuit">{i + 1}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-texte-gras text-base text-encre">{lierPonctuation(e.titre)}</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(e.texte)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
