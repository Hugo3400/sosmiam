import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { HoraireProposeDecrit } from "~/fonctions/reservations/decrire-horaire-propose";
import couleurs from "~/theme/couleurs";

type Props = {
  decrit: HoraireProposeDecrit;
  choisi: boolean;
  position: number;
  total: number;
  onPress: () => void;
};

export function OptionHoraireDemande({ decrit, choisi, position, total, onPress }: Props) {
  const ios = Platform.OS === "ios";
  return (
    <Pressable
      accessibilityRole={ios ? "button" : "radio"}
      accessibilityState={ios ? { selected: choisi } : { checked: choisi }}
      accessibilityLabel={`${decrit.lu}${ios ? `, ${position} sur ${total}` : ""}`}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 active:opacity-80 ${choisi ? "border-encre bg-jaune-clair" : "border-ligne bg-white"}`}
    >
      <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-encre bg-white">{choisi ? <View className="h-3 w-3 rounded-full bg-encre" /> : null}</View>
      <Text className="font-titre text-2xl text-encre">{decrit.heure}</Text>
      <View className="flex-1 gap-0.5">
        <Text className="font-texte-semi text-[13px] text-gris">{decrit.rang}</Text>
        {decrit.places ? (
          <View className="flex-row items-center gap-1">
            {decrit.tient ? null : <Ionicons name="alert-circle" size={14} color={couleurs["rouge-texte"]} />}
            <Text className={`font-texte-semi text-[13px] ${decrit.tient ? "text-encre" : "text-rouge-texte"}`}>{decrit.places}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
