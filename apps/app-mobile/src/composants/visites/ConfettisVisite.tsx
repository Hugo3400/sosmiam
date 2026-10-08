import { View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import couleurs from "~/theme/couleurs";

type Props = {
  /** Hauteur de la chute, en points (le haut de l'écran de célébration) */
  hauteur?: number;
};

const TEINTES = [couleurs.jaune, couleurs.tomate, couleurs.encre, couleurs["jaune-clair"], couleurs.jaune, couleurs.tomate];
const NOMBRE = 28;

// Pluie toujours la même d'une fois sur l'autre (pas de hasard au rendu) : position, retard, durée, dérive et rotation
// tirées d'une petite suite de nombres ; assez variée pour avoir l'air jetée à la main
const CONFETTIS = Array.from({ length: NOMBRE }, (_, i) => ({
  gauche: (i * 37 + 11) % 100,
  retardMs: (i * 53) % 450,
  dureeMs: 1700 + ((i * 71) % 900),
  derive: ((i * 29) % 70) - 35,
  rotation: 360 + ((i * 97) % 540),
  largeur: 6 + (i % 3) * 2,
  hauteur: i % 2 === 0 ? 12 : 7,
  rond: i % 5 === 0,
  teinte: TEINTES[i % TEINTES.length],
  // Version figée (« Réduire les animations ») : posés en haut de l'écran, sans bouger
  figeHaut: 8 + ((i * 41) % 130),
  figeRotation: ((i * 67) % 120) - 60,
}));

/**
 * Pluie de confettis aux couleurs de SOS Miam quand une visite est validée : une seule fois, puis ils disparaissent.
 * Figés en haut de l'écran si « Réduire les animations » est actif. Décoratifs : ignorés par le lecteur d'écran, et on
 * touche à travers.
 */
export function ConfettisVisite({ hauteur = 420 }: Props) {
  const animationsReduites = useReducedMotion();

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{ height: hauteur }}
    >
      {CONFETTIS.map((c, i) => {
        const forme = {
          position: "absolute" as const,
          left: `${c.gauche}%` as const,
          width: c.largeur,
          height: c.rond ? c.largeur : c.hauteur,
          borderRadius: c.rond ? c.largeur / 2 : 2,
          backgroundColor: c.teinte,
        };
        if (animationsReduites) {
          return <View key={i} style={[forme, { top: c.figeHaut, opacity: 0.85, transform: [{ rotate: `${c.figeRotation}deg` }] }]} />;
        }
        return (
          <Animated.View
            key={i}
            style={[
              forme,
              {
                top: -16,
                opacity: 0,
                // Animation CSS de Reanimated 4 : chaque confetti tombe en tournant et en dérivant, puis s'efface
                animationName: {
                  from: { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: "0deg" }] },
                  "75%": { opacity: 1 },
                  to: { opacity: 0, transform: [{ translateY: hauteur }, { translateX: c.derive }, { rotate: `${c.rotation}deg` }] },
                },
                animationDuration: c.dureeMs,
                animationDelay: c.retardMs,
                animationTimingFunction: "ease-in",
                animationFillMode: "both",
              },
            ]}
          />
        );
      })}
    </View>
  );
}
