import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  emoji: string;
  titre: string;
  /** Petite phrase sous le titre */
  detail?: string;
  onPress: () => void;
  /** « lien » : ouvre une page web ou une appli (Mail…) ; « bouton » : un écran ou une action de l'app */
  role?: "bouton" | "lien";
  /** Action qui efface quelque chose : titre en rouge, sans chevron */
  danger?: boolean;
  /** Élément à droite à la place du chevron */
  droite?: ReactNode;
};

/** Une ligne d'un écran de réglages : emoji, titre, détail et chevron, au moins 56 points de haut. */
export function LigneReglage({ emoji, titre, detail, onPress, role = "bouton", danger = false, droite }: Props) {
  const detailLie = detail ? lierPonctuation(detail) : null;
  return (
    <Pressable
      accessibilityRole={role === "lien" ? "link" : "button"}
      // Le détail fait partie du libellé (un indice serait lu en retard, voire jamais) ; « · » devient une simple virgule
      accessibilityLabel={detailLie ? `${titre}, ${detailLie.replace(/ · /g, ", ")}` : titre}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
    >
      <Text className="text-2xl">{emoji}</Text>
      <View className="flex-1">
        <Text className={`font-texte-gras text-base ${danger ? "text-rouge-texte" : "text-encre"}`}>{titre}</Text>
        {detailLie ? <Text className="font-texte text-sm text-gris">{detailLie}</Text> : null}
      </View>
      {droite ?? (danger ? null : <Ionicons name={role === "lien" ? "open-outline" : "chevron-forward"} size={20} color={couleurs.gris} />)}
    </Pressable>
  );
}
