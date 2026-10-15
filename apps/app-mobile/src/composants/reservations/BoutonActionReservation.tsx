import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  libelle: string;
  libelleLu: string;
  indice: string;
  danger?: boolean;
  onPress: () => void;
};

export function BoutonActionReservation({ libelle, libelleLu, indice, danger = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-11 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
    >
      <Text className={`font-texte-gras text-sm ${danger ? "text-rouge-texte" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
