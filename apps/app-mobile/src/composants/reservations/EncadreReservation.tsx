import { useEffect } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type ActionEncadreReservation = { libelle: string; indice?: string; onPress: () => void };

type Props = {
  emoji: string;
  titre: string;
  texte: string;
  ton: "doux" | "refus";
  action?: ActionEncadreReservation;
};

const STYLES = {
  doux: "border-encre bg-jaune-clair",
  refus: "border-tomate bg-rose-alerte",
} as const;

export function EncadreReservation({ emoji, titre, texte, ton, action }: Props) {
  useEffect(() => {
    if (ton === "refus") AccessibilityInfo.announceForAccessibility(`${titre}. ${texte}`);
  }, [ton, titre, texte]);

  return (
    <View className={`gap-1 rounded-2xl border-2 px-4 py-3 ${STYLES[ton]}`}>
      <View accessible accessibilityLabel={`${titre}. ${texte}`} className="flex-row gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
          {emoji}
        </Text>
        <View className="flex-1 gap-1">
          <Text className="font-texte-gras text-[15px] leading-5 text-encre">{lierPonctuation(titre)}</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
        </View>
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={action.indice}
          onPress={() => {
            vibrerLegerement();
            action.onPress();
          }}
          className="min-h-11 justify-center self-start pl-9 active:opacity-60"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">{action.libelle}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
