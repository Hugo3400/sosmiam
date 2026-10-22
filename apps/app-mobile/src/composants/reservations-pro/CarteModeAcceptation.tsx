import { Platform, Pressable, Text, View } from "react-native";

import type { ModeAcceptationReservation } from "@sos-miam/commun/types/reglages-reservations";
import { MODES_ACCEPTATION } from "~/contenus/textes-reglages-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  mode: ModeAcceptationReservation;
  choisi: boolean;
  desactive: boolean;
  indiceDesactive?: string;
  position: number;
  total: number;
  onPress: () => void;
};

export function CarteModeAcceptation({ mode, choisi, desactive, indiceDesactive, position, total, onPress }: Props) {
  const ios = Platform.OS === "ios";
  const { emoji, titre, texte } = MODES_ACCEPTATION[mode];
  return (
    <Pressable
      accessibilityRole={ios ? "button" : "radio"}
      accessibilityState={ios ? { selected: choisi, disabled: desactive } : { checked: choisi, disabled: desactive }}
      accessibilityLabel={`${titre}. ${texte}${ios ? `, ${position} sur ${total}` : ""}`}
      accessibilityHint={desactive ? indiceDesactive : undefined}
      disabled={desactive}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-carte border-2 border-encre px-4 py-3 active:opacity-80 ${choisi ? "bg-jaune-clair" : "bg-carte"} ${desactive && !choisi ? "opacity-40" : ""}`}
    >
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
        {emoji}
      </Text>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-gras text-base text-encre">{titre}</Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(texte)}</Text>
      </View>
      <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-encre bg-carte">
        {choisi ? <View className="h-3 w-3 rounded-full bg-encre" /> : null}
      </View>
    </Pressable>
  );
}
