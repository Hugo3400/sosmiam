import { Text, View } from "react-native";

import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";
import { TEXTES_BADGES } from "~/contenus/textes-badges";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  badge: BadgeCatalogue;
  obtenu: boolean;
  commentObtenir: string;
};

export function DetailBadge({ badge, obtenu, commentObtenir }: Props) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row items-start gap-3.5 rounded-carte border-2 border-encre bg-white p-4">
      <Text className="text-[34px] leading-10">{badge.emoji}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-gras text-base text-encre">{badge.nom}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(badge.texte)}</Text>
        <Text className="mt-1 font-texte-semi text-sm leading-5 text-encre">
          {lierPonctuation(obtenu ? TEXTES_BADGES.obtenu : TEXTES_BADGES.aObtenir(commentObtenir))}
        </Text>
      </View>
    </View>
  );
}
