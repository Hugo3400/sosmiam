import { Text, View } from "react-native";

import { ENGAGEMENTS_CHARTE_MIAM_SAFE_PAR_LANGUE } from "@sos-miam/commun/contenus/charte-miam-safe";
import { TEXTES_BLOCS_MON_LIEU_PAR_LANGUE } from "~/contenus/textes-blocs-mon-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function EngagementsCharteMiamSafe() {
  const T = utiliserTextes(TEXTES_BLOCS_MON_LIEU_PAR_LANGUE).charte;
  const engagements = utiliserTextes(ENGAGEMENTS_CHARTE_MIAM_SAFE_PAR_LANGUE);
  return (
    <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.engagementsTitre}
      </Text>
      {engagements.map((e, i) => (
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
