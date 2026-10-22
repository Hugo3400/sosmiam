import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  deplie: boolean;
};

export function ChevronPliable({ deplie }: Props) {
  const couleurs = utiliserCouleurs();
  const animationsReduites = useReducedMotion();
  const tour = useSharedValue(deplie ? 1 : 0);

  useEffect(() => {
    const cible = deplie ? 1 : 0;
    tour.value = animationsReduites ? cible : withTiming(cible, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [deplie, animationsReduites, tour]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${180 * tour.value}deg` }] }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`h-9 w-9 items-center justify-center rounded-full border-2 border-encre ${deplie ? "bg-carte" : "bg-jaune"}`}
    >
      <Animated.View style={style}>
        <Ionicons name="chevron-down" size={18} color={deplie ? couleurs.encre : couleurs.nuit} />
      </Animated.View>
    </View>
  );
}
