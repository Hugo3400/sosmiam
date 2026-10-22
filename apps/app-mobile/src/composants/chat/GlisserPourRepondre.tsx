import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourRepondre } from "~/hooks/utiliser-glisser-pour-repondre";

type Props = {
  actif: boolean;
  onRepondre: () => void;
  children: (icone: ReactNode) => ReactNode;
};

const TAILLE_ICONE = 32;

export function GlisserPourRepondre({ actif, onRepondre, children }: Props) {
  const couleurs = utiliserCouleurs();
  const { panHandlers, styleContenu, styleIcone } = utiliserGlisserPourRepondre(actif, onRepondre);
  const icone = actif ? (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: "absolute", left: -(TAILLE_ICONE + 10), top: 0, bottom: 0, justifyContent: "center" }, styleIcone]}
    >
      <View style={{ width: TAILLE_ICONE, height: TAILLE_ICONE, borderRadius: TAILLE_ICONE / 2 }} className="items-center justify-center border-2 border-encre bg-jaune">
        <Ionicons name="arrow-undo" size={16} color={couleurs.nuit} />
      </View>
    </Animated.View>
  ) : null;
  return (
    <View collapsable={false} {...panHandlers}>
      <Animated.View style={styleContenu}>{children(icone)}</Animated.View>
    </View>
  );
}
