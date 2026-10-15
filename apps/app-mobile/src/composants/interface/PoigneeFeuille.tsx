import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

import type { GlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";

type Props = {
  geste: GlisserPourFermer;
  ecart?: "petit" | "moyen" | "grand";
  fond?: "sombre" | "leger";
  className?: string;
  children?: ReactNode;
};

const ECARTS = { petit: "mb-1", moyen: "mb-3", grand: "mb-4" } as const;
const FONDS = { sombre: "rgba(0,0,0,0.4)", leger: "rgba(0,0,0,0.2)" } as const;
const BORDURE_HAUT = 2;

export function PoigneeFeuille({ geste, ecart = "moyen", fond = "sombre", className = "", children }: Props) {
  return (
    <View {...geste.panHandlers} className={`pt-3 web:cursor-grab web:touch-none web:select-none ${className}`}>
      {geste.styleJupe ? <Animated.View style={[styles.jupe, { backgroundColor: FONDS[fond] }, geste.styleJupe]} /> : null}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className={`${ECARTS[ecart]} h-1.5 w-12 self-center rounded-full bg-ligne`} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  jupe: { position: "absolute", left: 0, right: 0, bottom: "100%", marginBottom: BORDURE_HAUT, pointerEvents: "none" },
});
