import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  libelle: string;
  emoji?: string;
  choisi: boolean;
  onPress: () => void;
};

/** Un choix à toucher, plusieurs possibles : blanc, ou encre et jaune une fois coché. */
export function Pastille({ libelle, emoji, choisi, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: choisi }}
      accessibilityLabel={libelle}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`flex-row items-center gap-1.5 rounded-full border-2 border-encre px-4 py-2.5 active:opacity-80 ${choisi ? "bg-encre" : "bg-white"}`}
    >
      {emoji ? <Text className="text-base">{emoji}</Text> : null}
      <Text className={`font-texte-semi text-[15px] ${choisi ? "text-jaune" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
