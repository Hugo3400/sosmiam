import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";

import { TEXTES_MESSAGES as T } from "~/contenus/textes-messages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  systeme: string;
  texte: string;
  heure: string;
  onPress?: () => void;
  actionsLecteur?: Pick<PressableProps, "accessibilityActions" | "onAccessibilityAction">;
  children?: ReactNode;
};

const ICONES: Readonly<Record<string, ComponentProps<typeof Ionicons>["name"]>> = {
  "rappel-sortie": "alarm-outline",
  "sondage-clos": "stats-chart-outline",
};

export function CarteMessageSysteme({ systeme, texte, heure, onPress, actionsLecteur, children }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="mt-3 max-w-[88%] items-center self-center">
      <Pressable
        accessibilityLabel={`${T.sosMiam}, ${heure} : ${texte}`}
        onPress={onPress}
        disabled={!onPress}
        {...actionsLecteur}
        className="flex-row items-center gap-2 rounded-2xl border-2 border-dashed border-encre/40 bg-jaune-clair px-3.5 py-2.5 active:opacity-80"
      >
        <Ionicons name={ICONES[systeme] ?? "information-circle-outline"} size={18} color={couleurs.encre} />
        <Text className="shrink font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      </Pressable>
      {children}
      <Text accessibilityElementsHidden importantForAccessibility="no" className="mt-0.5 font-texte text-[11px] text-gris">
        {`${T.sosMiam} · ${heure}`}
      </Text>
    </View>
  );
}
