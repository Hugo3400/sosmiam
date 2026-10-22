import { Pressable, Text, useWindowDimensions, View } from "react-native";

import type { BadgeCatalogue } from "@sos-miam/commun/types/badge";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

const LARGEUR_PETIT_ECRAN = 370;

type Props = {
  badge: BadgeCatalogue;
  obtenu: boolean;
  selectionne?: boolean;
  commentObtenir?: string | null;
  onToucher?: () => void;
};

export function CaseBadge({ badge, obtenu, selectionne = false, commentObtenir = null, onToucher }: Props) {
  const petitEcran = useWindowDimensions().width < LARGEUR_PETIT_ECRAN;
  const taille = petitEcran ? "text-[10px] leading-[13px]" : "text-xs leading-4";
  const dessin = (
    <View className={`min-h-24 flex-1 items-center justify-center gap-1 rounded-2xl border-2 px-0.5 py-1.5 ${selectionne ? "border-tomate" : "border-encre"} ${obtenu ? "bg-jaune-clair" : "bg-carte"}`}>
      <View className="items-center gap-1">
        <Text className={`text-3xl ${obtenu ? "" : "opacity-40"}`}>{badge.emoji}</Text>
        <Text numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85} className={`text-center font-texte-semi ${taille} ${obtenu ? "text-encre" : "text-gris"}`}>
          {badge.nom}
        </Text>
      </View>
      {obtenu ? null : <Text className="absolute right-1 top-1 text-xs">🔒</Text>}
    </View>
  );
  if (!onToucher) {
    return (
      <View style={{ width: "25%" }} className="p-1">
        {dessin}
      </View>
    );
  }
  const etat = obtenu ? "obtenu" : "à débloquer";
  const aide = commentObtenir ? ` ${commentObtenir}` : "";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.nom}, ${etat}. ${badge.texte}.${aide}`}
      accessibilityState={{ selected: selectionne }}
      onPress={() => {
        vibrerLegerement();
        onToucher();
      }}
      style={{ width: "25%" }}
      className="p-1 active:opacity-70"
    >
      {dessin}
    </Pressable>
  );
}
