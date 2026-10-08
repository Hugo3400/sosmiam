import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";

type Props = {
  /** Tampons déjà posés */
  tampons: number;
  /** Visites qu'il faut pour remplir la carte (3 à 10) */
  sur: number;
  /** Le dernier tampon posé arrive d'en haut et s'écrase sur la carte, comme un coup de tampon (figé si « Réduire les animations ») */
  animerDernier?: boolean;
  /** « petite » pour une mini carte, « grande » pour la célébration et la carte en grand */
  taille?: "petite" | "grande";
};

const DIMENSIONS = {
  petite: { rond: 22, marque: "text-[11px]", cadeau: "text-[10px]", ecart: 5 },
  grande: { rond: 40, marque: "text-lg", cadeau: "text-base", ecart: 8 },
} as const;

// Un tampon n'est jamais posé tout droit : chacun penche un peu, comme à la main
const INCLINAISONS = [-8, 6, -3, 9, -6, 4, -9, 7, -4, 5];

// Le tampon tombe après le compteur de points de la célébration
const DELAI_COUP_DE_TAMPON_MS = 900;

/**
 * Les tampons d'une carte de fidélité : un rond par visite, jaune et tamponné une fois la visite validée ; le dernier rond
 * porte le cadeau. Lu d'une traite par le lecteur d'écran (« 4 tampons sur 5 »).
 */
export function RangeeTampons({ tampons, sur, animerDernier = false, taille = "petite" }: Props) {
  const animationsReduites = useReducedMotion();
  const total = Math.max(1, Math.round(sur));
  const poses = Math.min(total, Math.max(0, Math.round(tampons)));
  const dim = DIMENSIONS[taille];
  const animer = animerDernier && !animationsReduites && poses > 0;

  // Le coup de tampon : grand, transparent et de travers, puis posé d'un coup sec avec un petit rebond
  const avancee = useSharedValue(animer ? 0 : 1);
  useEffect(() => {
    if (!animer) {
      avancee.value = 1;
      return;
    }
    avancee.value = 0;
    avancee.value = withDelay(
      DELAI_COUP_DE_TAMPON_MS,
      withSequence(withTiming(1.08, { duration: 220, easing: Easing.in(Easing.quad) }), withSpring(1, { damping: 9, stiffness: 220 })),
    );
  }, [animer, poses, avancee]);

  const styleCoup = useAnimatedStyle(() => ({
    opacity: Math.min(1, avancee.value * 1.6),
    transform: [{ scale: 2.4 - 1.4 * avancee.value }, { rotate: `${-35 * (1 - Math.min(1, avancee.value))}deg` }],
  }));

  const libelle = poses === total ? `Carte pleine, ${total} tampons sur ${total}` : `${poses} tampon${poses > 1 ? "s" : ""} sur ${total}`;

  return (
    <View accessible accessibilityLabel={libelle} className="flex-row flex-wrap justify-center" style={{ gap: dim.ecart }}>
      {Array.from({ length: total }, (_, i) => {
        const pose = i < poses;
        const cadeau = i === total - 1;
        const rond = { width: dim.rond, height: dim.rond, borderRadius: dim.rond / 2 };
        if (!pose) {
          return (
            <View key={i} style={rond} className="items-center justify-center border-2 border-dashed border-gris/40 bg-white">
              {cadeau ? <Text className={`${dim.cadeau} opacity-60`}>🎁</Text> : null}
            </View>
          );
        }
        const marque = (
          <View
            style={[rond, { transform: [{ rotate: `${INCLINAISONS[i % INCLINAISONS.length]}deg` }] }]}
            className={`items-center justify-center border-2 border-encre ${cadeau ? "bg-tomate" : "bg-jaune"}`}
          >
            <Text className={`font-titre ${dim.marque} ${cadeau ? "text-white" : "text-encre"}`}>{cadeau ? "★" : "✓"}</Text>
          </View>
        );
        return animer && i === poses - 1 ? (
          <Animated.View key={i} style={styleCoup}>
            {marque}
          </Animated.View>
        ) : (
          <View key={i}>{marque}</View>
        );
      })}
    </View>
  );
}
