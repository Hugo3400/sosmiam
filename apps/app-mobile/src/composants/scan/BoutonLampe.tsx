import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  allumee: boolean;
  onBasculer: () => void;
};

/** La lampe du téléphone, pour scanner un QR dans une salle tamisée : ronde, 48 pt, jaune quand elle éclaire. */
export function BoutonLampe({ allumee, onBasculer }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={allumee ? "Éteindre la lampe" : "Allumer la lampe"}
      hitSlop={6}
      onPress={() => {
        vibrerLegerement();
        onBasculer();
      }}
      className={`h-12 w-12 items-center justify-center rounded-full border-2 active:opacity-80 ${allumee ? "border-jaune bg-jaune" : "border-white/70 bg-black/40"}`}
    >
      <Ionicons name={allumee ? "flashlight" : "flashlight-outline"} size={22} color={allumee ? couleurs.encre : "#FFFFFF"} />
    </Pressable>
  );
}
