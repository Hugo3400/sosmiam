import { useRef, type Ref } from "react";
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
  /** Ce que VoiceOver lit à la place du libellé, quand le libellé seul ne suffit pas (plusieurs « Demander l'addition ici » dans une liste) */
  libelleLu?: string;
  className?: string;
  /** Le bouton lui-même (pour y remettre le lecteur d'écran après une feuille) */
  ref?: Ref<View>;
};

const fonds: Record<Variante, string> = { jaune: "bg-jaune", blanc: "bg-white", encre: "bg-encre" };
const textes: Record<Variante, string> = { jaune: "text-encre", blanc: "text-encre", encre: "text-jaune" };
const ombres: Record<Variante, string> = { jaune: "bg-encre", blanc: "bg-encre", encre: "bg-white" };

// Deux appuis plus rapprochés que ça comptent pour un seul (évite d'ouvrir deux fois l'écran suivant)
const DELAI_ANTI_DOUBLE_APPUI = 700;

/** Le bouton SOS Miam, comme sur le site : bord noir et ombre décalée. Petite vibration au toucher, un seul appui pris en compte à la fois. */
export function Bouton({ libelle, onPress, variante = "jaune", desactive = false, petit = false, indice, libelleLu, className = "", ref }: Props) {
  const dernierAppui = useRef(0);
  return (
    <View className={`relative ${desactive ? "opacity-40" : ""} ${className}`}>
      <View className={`absolute inset-0 translate-x-1 translate-y-1 rounded-full ${ombres[variante]}`} />
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={libelleLu}
        accessibilityState={{ disabled: desactive }}
        accessibilityHint={indice}
        disabled={desactive}
        onPress={() => {
          const maintenant = Date.now();
          if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
          dernierAppui.current = maintenant;
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
