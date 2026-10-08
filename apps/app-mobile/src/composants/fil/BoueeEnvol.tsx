import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

/** La bouée qui s'envole quand on donne une rescousse (une fois par nouveau numéro). Décorative. */
export function BoueeEnvol({ numero }: { numero: number }) {
  const animationsReduites = useReducedMotion();
  const avancement = useSharedValue(1);

  useEffect(() => {
    if (!numero || animationsReduites) return;
    avancement.value = 0;
    avancement.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [numero, animationsReduites, avancement]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - avancement.value,
    transform: [
      { translateY: -200 * avancement.value },
      { scale: 1 + 0.8 * avancement.value },
      { rotate: `${30 * avancement.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute self-center text-6xl"
      style={[{ top: "40%" }, style]}
    >
      🛟
    </Animated.Text>
  );
}
