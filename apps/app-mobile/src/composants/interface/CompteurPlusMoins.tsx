import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ce qu'on compte, lu par VoiceOver : « Nombre de personnes » */
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  /** La valeur dite en entier : « 3 personnes », « 5 visites » */
  unite: (valeur: number) => string;
  onChanger: (valeur: number) => void;
};

/**
 * Un compteur − / + (boutons de 48 pt). Pour VoiceOver, c'est un seul élément réglable : on balaie vers le haut ou le bas
 * pour changer la valeur, qui est dite en entier.
 */
export function CompteurPlusMoins({ libelle, valeur, min, max, unite, onChanger }: Props) {
  const changer = (delta: number) => {
    const suivante = Math.min(max, Math.max(min, valeur + delta));
    if (suivante === valeur) return;
    vibrerLegerement();
    onChanger(suivante);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={libelle}
      accessibilityValue={{ text: unite(valeur) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => changer(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      className="flex-row items-center justify-between rounded-2xl border-2 border-encre bg-white px-3 py-2"
    >
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => changer(-1)}
        disabled={valeur <= min}
        className={`h-12 w-12 items-center justify-center rounded-full border-2 border-encre active:opacity-70 ${valeur <= min ? "opacity-30" : ""}`}
      >
        <Ionicons name="remove" size={24} color={couleurs.encre} />
      </Pressable>
      <Text className="font-titre text-4xl text-encre">{valeur}</Text>
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => changer(1)}
        disabled={valeur >= max}
        className={`h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-70 ${valeur >= max ? "opacity-30" : ""}`}
      >
        <Ionicons name="add" size={24} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
