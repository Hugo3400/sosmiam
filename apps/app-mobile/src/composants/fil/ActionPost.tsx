import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  icone: ReactNode;
  libelle: string;
  /** Ce que lit VoiceOver */
  description: string;
  actif?: boolean;
  /** Style du rond : « sos » pour la rescousse (jaune), sinon translucide */
  style?: "sos" | "normal";
  onPress: () => void;
};

/** Un bouton rond de la colonne d'actions d'un lieu (rescousse, garder, partager), avec son libellé dessous. */
export function ActionPost({ icone, libelle, description, actif = false, style = "normal", onPress }: Props) {
  const rond =
    style === "sos"
      ? actif ? "bg-encre border-[3px] border-jaune" : "bg-jaune border-[3px] border-encre"
      : actif ? "bg-tomate" : "bg-white/25";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description}
      accessibilityState={{ selected: actif }}
      hitSlop={6}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="items-center gap-1 active:scale-90"
    >
      <View className={`h-[52px] w-[52px] items-center justify-center rounded-full ${rond}`}>{icone}</View>
      <Text className="font-texte-gras text-xs text-white" style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 }}>
        {libelle}
      </Text>
    </Pressable>
  );
}
