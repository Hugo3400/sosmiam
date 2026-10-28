import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import { TEXTES_SCANNER_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-scanner-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  allumee: boolean;
  onBasculer: () => void;
};

/** La lampe du téléphone, pour scanner un QR dans une salle tamisée : ronde, 48 pt, jaune quand elle éclaire. */
export function BoutonLampe({ allumee, onBasculer }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_SCANNER_COMPTOIR_PAR_LANGUE);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={allumee ? T.eteindreLampe : T.allumerLampe}
      hitSlop={6}
      onPress={() => {
        vibrerLegerement();
        onBasculer();
      }}
      className={`h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-80 ${allumee ? "border-jaune bg-jaune" : "border-white/70 bg-black/40"}`}
    >
      <Ionicons name={allumee ? "flashlight" : "flashlight-outline"} size={22} color={allumee ? couleurs.nuit : "#FFFFFF"} />
    </Pressable>
  );
}
