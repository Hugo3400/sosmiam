import { Platform, Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  libelle: string;
  emoji?: string;
  choisi: boolean;
  onPress: () => void;
  /** « radio » quand un seul choix est possible (ex. la ville) */
  role?: "checkbox" | "radio";
};

/** Un choix à toucher : blanc, ou encre et jaune une fois coché. Au moins 44 points de haut. */
export function Pastille({ libelle, emoji, choisi, onPress, role = "checkbox" }: Props) {
  return (
    <Pressable
      accessibilityRole={role}
      // Radio : « checked » sur Android (TalkBack dit alors « non coché » aux autres) ; « selected » sur iPhone,
      // où l'état « checked » d'une radio est lu en anglais
      accessibilityState={role === "radio" && Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
      accessibilityLabel={libelle}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre px-4 py-2.5 active:opacity-80 ${choisi ? "bg-encre" : "bg-white"}`}
    >
      {emoji ? <Text className="text-base">{emoji}</Text> : null}
      <Text className={`font-texte-semi text-[15px] ${choisi ? "text-jaune" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
