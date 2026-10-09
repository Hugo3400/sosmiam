import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { CoinViseur } from "~/composants/scan/CoinViseur";

type Props = {
  /** Côté du carré à viser, en points */
  taille: number;
  /** Vrai pendant qu'on vise : les coins respirent doucement (jamais avec « Réduire les animations ») */
  actif: boolean;
  /** Au centre du carré : une roue d'attente ou un message pendant la validation */
  children?: ReactNode;
};

const VOILE = "rgba(17,17,17,0.62)";

/**
 * Le viseur du scanner : un voile sombre autour d'un carré net, et quatre coins jaunes qui respirent doucement
 * pendant qu'on vise. Posé par-dessus la caméra, il laisse passer les touchers.
 */
export function ViseurScan({ taille, actif, children }: Props) {
  const animationsReduites = useReducedMotion();
  const echelle = useSharedValue(1);

  useEffect(() => {
    if (!actif || animationsReduites) {
      cancelAnimation(echelle);
      echelle.value = 1;
      return;
    }
    echelle.value = withRepeat(withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [actif, animationsReduites, echelle]);

  const styleCoins = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));

  return (
    <View pointerEvents="box-none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", inset: 0 }}>
      <View pointerEvents="none" style={{ flex: 1, backgroundColor: VOILE }} />
      <View pointerEvents="none" style={{ flexDirection: "row", height: taille }}>
        <View style={{ flex: 1, backgroundColor: VOILE }} />
        <View style={{ width: taille, height: taille }}>
          <Animated.View style={[{ position: "absolute", inset: 0 }, styleCoins]}>
            <CoinViseur position="haut-gauche" />
            <CoinViseur position="haut-droite" />
            <CoinViseur position="bas-gauche" />
            <CoinViseur position="bas-droite" />
          </Animated.View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>{children}</View>
        </View>
        <View style={{ flex: 1, backgroundColor: VOILE }} />
      </View>
      <View pointerEvents="none" style={{ flex: 1, backgroundColor: VOILE }} />
    </View>
  );
}
