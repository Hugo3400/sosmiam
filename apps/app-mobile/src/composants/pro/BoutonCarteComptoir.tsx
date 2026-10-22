import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  libelle: string;
  libelleLu: string;
  plein: boolean;
  icone?: "checkmark" | "gift";
  desactive?: boolean;
  indice?: string;
  onPress: () => void;
};

/** Un bouton de 48 pt au moins, comme tous les gestes du mode pro (on les fait souvent debout, plateau à la main) */
export function BoutonCarteComptoir({ libelle, libelleLu, plein, icone, desactive = false, indice, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      accessibilityHint={indice}
      accessibilityState={{ disabled: desactive }}
      disabled={desactive}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-4 active:opacity-80 ${plein ? "bg-jaune" : "bg-carte"} ${desactive ? "opacity-40" : ""}`}
    >
      {icone ? <Ionicons name={icone} size={18} color={plein ? couleurs.nuit : couleurs.encre} /> : null}
      <Text className={`text-center font-texte-gras text-base ${plein ? "text-nuit" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
