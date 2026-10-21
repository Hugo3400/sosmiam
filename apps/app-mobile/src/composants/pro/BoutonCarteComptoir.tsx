import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

/** Un bouton de 48 pt au moins, comme tous les gestes du mode pro (on les fait souvent debout, plateau à la main) */
export function BoutonCarteComptoir({ libelle, libelleLu, plein, icone, onPress }: { libelle: string; libelleLu: string; plein: boolean; icone?: "checkmark" | "gift"; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-4 active:opacity-80 ${plein ? "bg-jaune" : "bg-white"}`}
    >
      {icone ? <Ionicons name={icone} size={18} color={couleurs.encre} /> : null}
      <Text className="font-texte-gras text-base text-encre">{libelle}</Text>
    </Pressable>
  );
}
