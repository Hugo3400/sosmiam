import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  /** Son coupé (réglage commun à tout le fil) */
  sonCoupe: boolean;
  onBasculer: () => void;
  /** Hauteur de la rangée d'indications, juste sous l'en-tête du fil */
  haut: number;
};

// Rond de 32 pt aligné sur les pastilles (« Vidéo d'illustration ») ; la zone de toucher déborde pour faire 44 pt
const DEBORD = 6;

/** Le petit haut-parleur en haut à droite d'une vidéo qui a du son : coupe ou remet le son de tout le fil. */
export function BoutonSon({ sonCoupe, onBasculer, haut }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sonCoupe ? "Mettre le son" : "Couper le son"}
      hitSlop={DEBORD}
      onPress={() => {
        vibrerLegerement();
        onBasculer();
      }}
      style={{ top: haut - 2 }}
      className="absolute right-4 h-8 w-8 items-center justify-center rounded-full bg-black/55 active:opacity-70"
    >
      <Ionicons name={sonCoupe ? "volume-mute" : "volume-high"} size={17} color="#FFFFFF" />
    </Pressable>
  );
}
