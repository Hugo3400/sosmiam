import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Variante = "jaune" | "blanc" | "encre";

type Props = {
  libelle: string;
  onPress: () => void;
  variante?: Variante;
  desactive?: boolean;
  petit?: boolean;
  /** Ce qui se passe quand on touche le bouton, lu par VoiceOver */
  indice?: string;
  className?: string;
};

const fonds: Record<Variante, string> = { jaune: "bg-jaune", blanc: "bg-white", encre: "bg-encre" };
const textes: Record<Variante, string> = { jaune: "text-encre", blanc: "text-encre", encre: "text-jaune" };

/** Le bouton SOS Miam, comme sur le site : bord noir et ombre décalée. Petite vibration au toucher. */
export function Bouton({ libelle, onPress, variante = "jaune", desactive = false, petit = false, indice, className = "" }: Props) {
  return (
    <View className={`relative ${desactive ? "opacity-40" : ""} ${className}`}>
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: desactive }}
        accessibilityHint={indice}
        disabled={desactive}
        onPress={() => {
          vibrerLegerement();
          onPress();
        }}
        className={`items-center rounded-full border-2 border-encre ${petit ? "px-5 py-2.5" : "px-6 py-4"} ${fonds[variante]}
          active:translate-x-0.5 active:translate-y-0.5`}
      >
        <Text className={`font-texte-gras ${petit ? "text-sm" : "text-base"} ${textes[variante]}`}>{libelle}</Text>
      </Pressable>
    </View>
  );
}
