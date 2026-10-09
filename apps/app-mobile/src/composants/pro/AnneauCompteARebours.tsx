import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import couleurs from "~/theme/couleurs";

type Props = {
  /** Côté de l'anneau, en points */
  taille: number;
  /** Temps avant le prochain changement du QR */
  changeDansMs: number;
  /** Durée d'une fenêtre (30 s) */
  dureeMs: number;
  /** Change à chaque nouvelle fenêtre : l'anneau repart plein */
  fenetre: number;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const EPAISSEUR = 8;

/**
 * Anneau jaune autour du QR qui se vide jusqu'au prochain changement (toutes les 30 s) : l'équipe voit d'un coup d'œil
 * que le QR est vivant. « Réduire les animations » : l'anneau reste fixe (le texte dit le temps restant).
 */
export function AnneauCompteARebours({ taille, changeDansMs, dureeMs, fenetre }: Props) {
  const animationsReduites = useReducedMotion();
  const rayon = (taille - EPAISSEUR) / 2;
  const circonference = 2 * Math.PI * rayon;
  const restant = useSharedValue(Math.min(1, Math.max(0, changeDansMs / dureeMs)));

  useEffect(() => {
    cancelAnimation(restant);
    restant.value = Math.min(1, Math.max(0, changeDansMs / dureeMs));
    if (animationsReduites) return;
    restant.value = withTiming(0, { duration: Math.max(0, changeDansMs), easing: Easing.linear });
    // On ne repart que sur une nouvelle fenêtre : relire le comptoir entre-temps ne fait pas sauter l'anneau
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fenetre, animationsReduites]);

  const proprietes = useAnimatedProps(() => ({ strokeDashoffset: circonference * (1 - restant.value) }));

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", width: taille, height: taille }}>
      <Svg width={taille} height={taille} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={taille / 2} cy={taille / 2} r={rayon} stroke={couleurs.ligne} strokeWidth={EPAISSEUR} fill="none" />
        <AnimatedCircle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          stroke={couleurs.jaune}
          strokeWidth={EPAISSEUR}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circonference} ${circonference}`}
          animatedProps={proprietes}
        />
      </Svg>
    </View>
  );
}
