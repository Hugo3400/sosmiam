import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  titre: string;
  texte: string;
  icone: ComponentProps<typeof Ionicons>["name"];
  /** « principale » : la grande tuile noire du scan ; « secondaire » : une tuile blanche plus calme */
  variante: "principale" | "secondaire";
  indice?: string;
  onPress: () => void;
};

/** Une grande tuile d'action de l'onglet Scan : une icône, un titre, une phrase, et une ombre décalée comme les boutons. */
export function TuileScan({ titre, texte, icone, variante, indice, onPress }: Props) {
  const principale = variante === "principale";
  return (
    <View className="relative">
      {/* Ombre décalée, comme les boutons de l'app */}
      <View className={`absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte ${principale ? "bg-jaune" : "bg-encre"}`} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${titre}. ${texte}`}
        accessibilityHint={indice}
        onPress={() => {
          vibrerLegerement();
          onPress();
        }}
        className={`flex-row items-center gap-4 rounded-carte border-2 border-encre active:translate-x-0.5 active:translate-y-0.5 ${
          principale ? "bg-encre px-5 py-6" : "bg-white px-5 py-4"
        }`}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={`items-center justify-center rounded-2xl border-2 ${principale ? "h-16 w-16 border-jaune bg-jaune" : "h-12 w-12 border-encre bg-jaune-clair"}`}
        >
          <Ionicons name={icone} size={principale ? 34 : 24} color={couleurs.encre} />
        </View>
        <View className="flex-1 gap-1">
          <Text className={`font-titre-gras ${principale ? "text-[22px] leading-7 text-white" : "text-lg leading-6 text-encre"}`}>{lierPonctuation(titre)}</Text>
          <Text className={`font-texte text-[15px] leading-[21px] ${principale ? "text-white/80" : "text-gris"}`}>{lierPonctuation(texte)}</Text>
        </View>
        <Ionicons accessibilityElementsHidden importantForAccessibility="no-hide-descendants" name="arrow-forward" size={22} color={principale ? couleurs.jaune : couleurs.encre} />
      </Pressable>
    </View>
  );
}
