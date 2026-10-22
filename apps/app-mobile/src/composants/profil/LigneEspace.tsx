import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  emoji: string;
  titre: string;
  detail: string;
  indice: string;
  separation: boolean;
  onPress: () => void;
};

export function LigneEspace({ emoji, titre, detail, indice, separation, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${retirerEmoji(detail).replace(/ · /g, ", ")}`}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-16 flex-row items-center gap-3 py-2.5 active:opacity-70 ${separation ? "border-b border-ligne" : ""}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune">
        <Text className="text-xl">{emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">{titre}</Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detail)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
    </Pressable>
  );
}
