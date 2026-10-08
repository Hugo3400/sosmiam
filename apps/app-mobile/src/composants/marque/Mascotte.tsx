import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { Bouee } from "~/composants/marque/Bouee";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";

/** Les expressions de la bouée (mêmes que sur le site). */
export type ExpressionMascotte = "miam" | "clin" | "surprise";

type Props = {
  expression: ExpressionMascotte;
  /** Largeur et hauteur, en points */
  taille?: number;
  /** Petit flottement continu (coupé si l'iPhone demande de réduire les animations) */
  flotte?: boolean;
};

/** La mascotte du kit de marque : la bouée avec sa corde, sur un disque jaune clair. Décorative (ignorée par VoiceOver). */
export function Mascotte({ expression, taille = 160, flotte = false }: Props) {
  const animationsReduites = useReducedMotion();
  const decalage = useSharedValue(0);

  useEffect(() => {
    if (!flotte || animationsReduites) {
      decalage.value = 0;
      return;
    }
    decalage.value = withRepeat(withTiming(-taille * 0.05, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [flotte, animationsReduites, taille, decalage]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));

  return (
    <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width: taille, height: taille }, style]}>
      <Svg width={taille} height={taille} viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r="72" fill={c.jauneClair} />
        <Bouee x={18} y={18} taille={124} expression={expression} corde />
      </Svg>
    </Animated.View>
  );
}
