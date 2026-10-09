import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  icone: keyof typeof Ionicons.glyphMap;
  /** Ce que fait le bouton, lu par VoiceOver et TalkBack : « Monter Tiramisu », « Renommer la section Desserts » */
  libelle: string;
  /** Grisé et sans effet (au bout d'une liste, par exemple) */
  desactive?: boolean;
  onPress: () => void;
};

/** Petit bouton rond à icône (44 points, bord noir), grisé quand il ne fait rien : flèches pour ranger, crayon pour modifier. */
export function BoutonIconeRond({ icone, libelle, desactive = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ disabled: desactive }}
      disabled={desactive}
      hitSlop={4}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`h-11 w-11 items-center justify-center rounded-full border-2 active:opacity-80 ${desactive ? "border-ligne bg-creme" : "border-encre bg-white"}`}
    >
      <Ionicons name={icone} size={18} color={desactive ? couleurs.ligne : couleurs.encre} />
    </Pressable>
  );
}
