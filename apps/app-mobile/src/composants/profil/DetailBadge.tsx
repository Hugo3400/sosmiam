import { Text, View } from "react-native";

import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  badge: BadgeCatalogue | null;
  obtenu: boolean;
  commentObtenir: string;
};

export function DetailBadge({ badge, obtenu, commentObtenir }: Props) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="min-h-16 justify-center rounded-2xl border-2 border-ligne bg-white px-4 py-3">
      {badge ? (
        <>
          <Text className="font-texte-gras text-base text-encre">
            {badge.emoji} {badge.nom}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(badge.texte)}</Text>
          <Text className="mt-1 font-texte-semi text-sm text-encre">{lierPonctuation(obtenu ? "✅ Obtenu, bravo !" : `🔒 ${commentObtenir}`)}</Text>
        </>
      ) : (
        <Text className="font-texte text-sm text-gris">{"👆 Touche un badge pour savoir comment l'obtenir."}</Text>
      )}
    </View>
  );
}
