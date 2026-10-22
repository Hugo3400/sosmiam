import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  pleine: boolean;
  taille: number;
};

const POSEE = { position: "absolute" as const, left: 0, top: 0 };

export function EtoileAvis({ pleine, taille }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: taille, height: taille }}>
      {pleine ? <Ionicons name="star" size={taille} color={couleurs.jaune} style={POSEE} /> : null}
      <Ionicons name="star-outline" size={taille} color={pleine ? couleurs.encre : couleurs.gris} style={POSEE} />
    </View>
  );
}
