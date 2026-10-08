import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, SlideInDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContenuCreerCompte } from "~/composants/invite/ContenuCreerCompte";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

type Props = {
  /** Le geste qui demande un compte (null : rien d'affiché) */
  raison: RaisonCompte | null;
  /** « Je m'inscris » : à la feuille d'en dessous de se refermer, puis d'ouvrir l'inscription */
  onInscrire: () => void;
  /** « Plus tard », fond assombri, retour Android ou geste d'échappement de VoiceOver : on retrouve la feuille d'en dessous telle quelle */
  onFermer: () => void;
};

/**
 * La feuille « Crée ton compte pour … » posée au-dessus d'une autre feuille (les commentaires), sans deuxième fenêtre :
 * iOS refuserait de l'empiler, et la feuille d'en dessous reste montée (après « Plus tard », on reprend la lecture là où
 * on en était). Comme MenuCommentaire, la feuille d'en dessous se cache au lecteur d'écran pendant qu'elle est là, et
 * remet le lecteur d'écran sur le geste touché quand elle s'en va.
 */
export function FeuilleCreerComptePosee({ raison, onInscrire, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const titre = useRef<Text>(null);

  // Pas une vraie fenêtre : iOS n'y emmène pas VoiceOver tout seul, on le place sur le titre une fois la feuille montée
  useEffect(() => {
    if (raison === null) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(titre.current), 250);
    return () => clearTimeout(minuterie);
  }, [raison]);

  if (raison === null) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer, et continuer sans compte"
          onPress={onFermer}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        />
      </Animated.View>
      {/* Animations réduites dans les réglages : la feuille apparaît en fondu au lieu de monter du bas */}
      <Animated.View
        entering={animationsReduites ? FadeIn.duration(160) : SlideInDown.duration(220)}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      >
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onFermer}
          // Jamais sous la barre d'état : avec un très grand texte, le haut défile et les deux boutons restent à l'écran
          style={{ paddingBottom: marges.bottom + 12, maxHeight: Math.min(hauteurEcran * 0.88, hauteurEcran - marges.top) }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-ligne" />
          <ContenuCreerCompte raison={raison} refTitre={titre} onInscrire={onInscrire} onPlusTard={onFermer} />
        </View>
      </Animated.View>
    </View>
  );
}
