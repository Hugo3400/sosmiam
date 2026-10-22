import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  libelle: string;
  onPress: () => void;
  libelleLu?: string;
  indice?: string;
  icone?: ComponentProps<typeof Ionicons>["name"];
  fond?: "creme" | "blanc";
  grand?: boolean;
};

const FONDS = { creme: "bg-creme", blanc: "bg-carte" } as const;

export function BoutonContour({ libelle, onPress, libelleLu, indice, icone, fond = "creme", grand = false }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu ?? libelle}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-5 active:opacity-70 ${grand ? "min-h-12" : "min-h-11"} ${FONDS[fond]}`}
    >
      {icone ? <Ionicons name={icone} size={16} color={couleurs.encre} /> : null}
      <Text className={`text-center font-texte-gras text-encre ${grand ? "text-base" : "text-[15px]"}`}>{libelle}</Text>
    </Pressable>
  );
}
