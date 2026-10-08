import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  icone: ReactNode;
  libelle: string;
  /** Ce que lit VoiceOver */
  description: string;
  /** Ce qui se passe quand on le touche, lu par VoiceOver après une pause (en visite : il faudra un compte) */
  indice?: string;
  actif?: boolean;
  /** Style du rond : « sos » (jaune), « normal » (translucide) ou « transparent » (icône seule, sur une vidéo) */
  style?: "sos" | "normal" | "transparent";
  onPress: () => void;
};

/** Un bouton rond de la colonne d'actions d'un lieu (rescousse, garder, partager), avec son libellé dessous. */
export function ActionPost({ icone, libelle, description, indice, actif = false, style = "normal", onPress }: Props) {
  const rond =
    style === "sos"
      ? actif ? "bg-encre border-[3px] border-jaune" : "bg-jaune border-[3px] border-encre"
      : style === "transparent" ? "" : actif ? "bg-tomate" : "bg-white/25";
  // Sur une vidéo claire, une ombre garde l'icône lisible
  const ombreIcone = style === "transparent" ? { shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } } : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description}
      accessibilityHint={indice}
      accessibilityState={{ selected: actif }}
      hitSlop={6}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="items-center gap-1 active:scale-90"
    >
      <View style={ombreIcone} className={`h-[48px] w-[48px] items-center justify-center rounded-full ${rond}`}>{icone}</View>
      {libelle ? (
        <Text className="font-texte-gras text-xs text-white" style={{ textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 }}>
          {libelle}
        </Text>
      ) : null}
    </Pressable>
  );
}
