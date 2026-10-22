import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  lieu: Pick<Lieu, "nom" | "emoji">;
  /** Allumée : le commentaire part au nom du lieu, avec son badge */
  active: boolean;
  onBasculer: (active: boolean) => void;
};

/** Pour le gérant du lieu de la publication, au-dessus du champ : écrire sous son prénom, ou au nom du lieu. */
export function PastilleAuNomDuLieu({ lieu, active, onBasculer }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Répondre au nom de ${lieu.nom}`}
      accessibilityHint={active ? "Ton commentaire part avec le nom et le badge du lieu" : "Ton commentaire part sous ton prénom"}
      accessibilityState={{ checked: active }}
      hitSlop={4}
      onPress={() => {
        vibrerLegerement();
        onBasculer(!active);
      }}
      className={`mb-2 min-h-9 flex-row items-center gap-1.5 self-start rounded-full border-2 border-encre px-3 active:opacity-70 ${active ? "bg-jaune" : "bg-carte"}`}
    >
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" allowFontScaling={false} className="text-base">
        {lieu.emoji}
      </Text>
      <Text className={`font-texte-gras text-[13px] ${active ? "text-nuit" : "text-encre"}`}>Répondre au nom du lieu</Text>
      <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={18} color={active ? couleurs.nuit : couleurs.encre} />
    </Pressable>
  );
}
