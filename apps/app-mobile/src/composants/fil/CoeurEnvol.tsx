import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";

/** Le cœur qui grossit puis s'envole au double appui (« J'aime »), une fois par nouveau numéro, avec un petit retour haptique. Décoratif. */
export function CoeurEnvol({ numero }: { numero: number }) {
  const animationsReduites = useReducedMotion();
  const avancement = useSharedValue(1);

  useEffect(() => {
    if (!numero) return;
    // La vibration se sent même quand les animations sont réduites
    vibrerJaime();
    if (animationsReduites) return;
    avancement.value = 0;
    avancement.value = withSequence(withTiming(0.35, { duration: 220, easing: Easing.out(Easing.back(2)) }), withTiming(1, { duration: 650 }));
  }, [numero, animationsReduites, avancement]);

  const style = useAnimatedStyle(() => ({
    opacity: avancement.value < 0.35 ? 1 : 1 - (avancement.value - 0.35) / 0.65,
    transform: [
      { translateY: avancement.value < 0.35 ? 0 : -140 * (avancement.value - 0.35) },
      { scale: avancement.value < 0.35 ? 0.4 + (avancement.value / 0.35) * 0.9 : 1.3 },
      { rotate: "-12deg" },
    ],
  }));

  return (
    <Animated.Text
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute self-center text-[96px]"
      style={[{ top: "34%" }, style]}
    >
      ❤️
    </Animated.Text>
  );
}
