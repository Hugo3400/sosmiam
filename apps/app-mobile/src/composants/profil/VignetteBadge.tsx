import { Text, useWindowDimensions, View } from "react-native";

import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";

const LARGEUR_PETIT_ECRAN = 370;

type Props = {
  badge: BadgeCatalogue;
};

export function VignetteBadge({ badge }: Props) {
  const petitEcran = useWindowDimensions().width < LARGEUR_PETIT_ECRAN;
  return (
    <View style={{ width: "25%" }} className="p-1">
      <View className="min-h-24 flex-1 items-center justify-center gap-1 rounded-2xl border-2 border-encre bg-jaune-clair px-0.5 py-1.5">
        <Text className="text-3xl">{badge.emoji}</Text>
        <Text
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          className={`text-center font-texte-semi text-encre ${petitEcran ? "text-[10px] leading-[13px]" : "text-xs leading-4"}`}
        >
          {badge.nom}
        </Text>
      </View>
    </View>
  );
}
