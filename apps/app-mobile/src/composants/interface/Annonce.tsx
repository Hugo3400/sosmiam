import { useEffect } from "react";
import { AccessibilityInfo, Platform, Text } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

type Props = {
  /** Message à afficher ; un nouveau numéro relance l'annonce même si le texte est identique */
  annonce: { texte: string; numero: number } | null;
  /** Distance depuis le haut de l'écran */
  haut: number;
  onFin: () => void;
};

const DUREE = 2400;

// Les emoji restent à l'écran mais ne sont pas lus : VoiceOver et TalkBack en diraient le nom (« fusée », « bouée de sauvetage »…)
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** Petit message qui apparaît en haut puis s'efface tout seul ; aussi lu par VoiceOver et TalkBack, sans ses emoji. */
export function Annonce({ annonce, haut, onFin }: Props) {
  useEffect(() => {
    if (!annonce) return;
    const texte = annonce.texte.replace(EMOJI, "").replace(/\s+/g, " ").trim();
    // iOS : l'annonce attend que VoiceOver ait fini sa phrase (le bouton qu'il vient de lire, l'écran où il revient) au lieu de la couper
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
    else AccessibilityInfo.announceForAccessibility(texte);
    const minuterie = setTimeout(onFin, DUREE);
    return () => clearTimeout(minuterie);
  }, [annonce, onFin]);

  if (!annonce) return null;
  return (
    <Animated.View
      key={annonce.numero}
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(220)}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ top: haut }}
      className="absolute inset-x-5 items-center"
    >
      <Text className="overflow-hidden rounded-full border-2 border-encre bg-jaune px-4 py-2.5 text-center font-texte-gras text-[15px] text-encre">
        {annonce.texte}
      </Text>
    </Animated.View>
  );
}
