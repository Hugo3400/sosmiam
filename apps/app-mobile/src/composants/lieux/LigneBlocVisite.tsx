import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Affiché, jamais lu (VoiceOver en dirait le nom) */
  emoji: string;
  titre: string;
  texte?: string;
  /** Tout ce que VoiceOver lit d'une traite (titre, texte et ce que montre `enPlus`) */
  libelleLu: string;
  indice: string;
  onPress: () => void;
  /** Sous le titre : les tampons d'une carte de fidélité… */
  enPlus?: ReactNode;
};

/** Une ligne du bloc « Tu passes chez eux ? » de la fiche d'un lieu (carte de fidélité, réserver) : on la touche pour aller plus loin. */
export function LigneBlocVisite({ emoji, titre, texte, libelleLu, indice, onPress, enPlus }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-14 flex-row items-center gap-3 border-t border-ligne pt-4 active:opacity-70"
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="h-11 w-11 items-center justify-center rounded-2xl bg-jaune-clair">
        <Text className="text-xl">{emoji}</Text>
      </View>
      <View className="flex-1 gap-1.5">
        <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(titre)}</Text>
        {enPlus}
        {texte ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text> : null}
      </View>
      <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="chevron-forward" size={20} color={couleurs.encre} />
    </Pressable>
  );
}
