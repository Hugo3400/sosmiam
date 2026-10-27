import { Text, View } from "react-native";

import { POINTS_ARTICLE_ACTUS } from "@sos-miam/commun/regles/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MES_ARTICLES_ACTUS } from "~/contenus/textes-mes-articles-actus";
import { trouverProchainBadgeActus } from "~/fonctions/actus/trouver-prochain-badge-actus";

type Props = { publies: number; T: Traduction<typeof TEXTES_MES_ARTICLES_ACTUS> };

export function ProgressionBadgeActus({ publies, T }: Props) {
  const prochain = trouverProchainBadgeActus(publies);
  const points = T.points(POINTS_ARTICLE_ACTUS, publies * POINTS_ARTICLE_ACTUS);
  if (!prochain) {
    return (
      <View className="gap-1 rounded-[18px] border-2 border-encre bg-carte px-4 py-3.5">
        <Text className="font-texte-gras text-[15px] text-encre">{T.tousLesBadges}</Text>
        <Text className="font-texte text-xs text-gris">{points}</Text>
      </View>
    );
  }
  const nom = T.badges[prochain.id];
  const part = Math.min(1, publies / prochain.objectif);
  return (
    <View className="gap-2.5 rounded-[18px] border-2 border-encre bg-carte px-4 py-3.5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="flex-1 font-texte-gras text-[15px] text-encre">{nom}</Text>
        <Text className="font-texte-gras text-[13px] text-encre">{T.progression(publies, prochain.objectif)}</Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={T.progressionLue(nom)}
        accessibilityValue={{ min: 0, max: prochain.objectif, now: publies }}
        className="h-3 overflow-hidden rounded-full border-2 border-encre bg-ligne"
      >
        <View style={{ width: `${part * 100}%` }} className="h-full bg-jaune" />
      </View>
      <Text className="font-texte text-xs text-gris">{points}</Text>
    </View>
  );
}
