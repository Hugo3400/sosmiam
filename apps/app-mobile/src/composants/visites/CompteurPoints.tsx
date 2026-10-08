import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

type Props = {
  /** Points gagnés (+15, ou +25 pendant un SOS) */
  points: number;
  /** Visite pendant un SOS du lieu : pastille tomate et mention « SOS » */
  sos?: boolean;
};

const DELAI_DEPART_MS = 250;
const DUREE_DEFILEMENT_MS = 800;

/**
 * Les points d'une visite validée, qui défilent de 0 jusqu'au total puis rebondissent (affichés tels quels si
 * « Réduire les animations » est actif). Lu une seule fois, avec la valeur finale, jamais les chiffres qui défilent.
 */
export function CompteurPoints({ points, sos = false }: Props) {
  const animationsReduites = useReducedMotion();
  const total = Math.max(0, Math.round(points));
  const figer = animationsReduites || total === 0;
  const [defile, setDefile] = useState(0);
  const affiche = figer ? total : defile;
  const rebond = useSharedValue(1);

  useEffect(() => {
    if (figer) return;
    let image = 0;
    let depart = 0;
    const avancer = (instant: number) => {
      if (!depart) depart = instant;
      const t = Math.min(1, (instant - depart) / DUREE_DEFILEMENT_MS);
      // Rapide au début, puis ralenti sur les derniers points
      setDefile(Math.round(total * (1 - (1 - t) ** 3)));
      if (t < 1) {
        image = requestAnimationFrame(avancer);
        return;
      }
      rebond.value = withSequence(withTiming(1.18, { duration: 140 }), withSpring(1, { damping: 8, stiffness: 260 }));
    };
    const minuterie = setTimeout(() => {
      image = requestAnimationFrame(avancer);
    }, DELAI_DEPART_MS);
    return () => {
      clearTimeout(minuterie);
      cancelAnimationFrame(image);
    };
  }, [total, figer, rebond]);

  const styleRebond = useAnimatedStyle(() => ({ transform: [{ scale: rebond.value }] }));

  return (
    <View accessible accessibilityLabel={`+${total} points${sos ? ", pendant un SOS" : ""}`} className="items-center">
      <Animated.View
        style={styleRebond}
        className={`flex-row items-baseline gap-1.5 rounded-full border-2 border-encre px-6 py-2 ${sos ? "bg-tomate" : "bg-jaune"}`}
      >
        <Text className="font-titre text-5xl text-encre" style={{ fontVariant: ["tabular-nums"] }}>
          +{affiche}
        </Text>
        <Text className="font-texte-gras text-lg text-encre">{sos ? "points SOS" : "points"}</Text>
      </Animated.View>
    </View>
  );
}
