import { Pressable, Text, View } from "react-native";

import type { LieuCiteActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";

type Props = {
  lieu: LieuCiteActus;
  rang: number | null;
  T: Traduction<typeof TEXTES_ACTUS>["article"];
  onVoir: (lieu: LieuCiteActus) => void;
  onYAller: (lieu: LieuCiteActus) => void;
};

export function LieuCiteArticle({ lieu, rang, T, onVoir, onYAller }: Props) {
  const details = [lieu.quartier, lieu.ville, lieu.verifie ? T.verifie : null].filter(Boolean).join(" · ");
  return (
    <View className="gap-3 rounded-[18px] border-2 border-encre bg-carte p-3">
      <View accessible className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl border-2 border-encre bg-jaune-clair">
          <Text className="text-2xl">{lieu.emoji}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-[15px] text-encre">{rang ? `${rang}. ${lieu.nom}` : lieu.nom}</Text>
          <Text className="font-texte text-[13px] text-gris">{details}</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.voirFicheLu(lieu.nom)}
          onPress={() => onVoir(lieu)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-encre bg-carte px-3 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-encre">{T.voirFiche}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.yAllerLu(lieu.nom)}
          onPress={() => onYAller(lieu)}
          className="min-h-11 flex-1 items-center justify-center rounded-full border-2 border-nuit bg-jaune px-3 active:opacity-80"
        >
          <Text className="font-texte-gras text-sm text-nuit">{T.yAller}</Text>
        </Pressable>
      </View>
    </View>
  );
}
