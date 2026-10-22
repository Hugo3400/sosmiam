import { useEffect, useRef, useState } from "react";
import { PanResponder } from "react-native";
import { cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { noterGlissementReponse } from "~/services/glissement-reponse";

const SEUIL_GLISSER_REPONDRE = 60;
const DEPART = 10;
const MAX = 90;
const RESISTANCE = 0.35;
const DUREE_RETOUR = 180;

const suivreDoigt = (dx: number) => (dx <= 0 ? 0 : dx <= SEUIL_GLISSER_REPONDRE ? dx : Math.min(MAX, SEUIL_GLISSER_REPONDRE + (dx - SEUIL_GLISSER_REPONDRE) * RESISTANCE));

export function utiliserGlisserPourRepondre(actif: boolean, onRepondre: () => void) {
  const animationsReduites = useReducedMotion();
  const decalage = useSharedValue(0);
  const dernier = useRef({ actif, onRepondre, animationsReduites });

  useEffect(() => {
    dernier.current = { actif, onRepondre, animationsReduites };
  });

  const styleContenu = useAnimatedStyle(() => ({ transform: [{ translateX: decalage.value }] }));
  const styleIcone = useAnimatedStyle(() => ({
    opacity: interpolate(decalage.value, [DEPART, SEUIL_GLISSER_REPONDRE], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(decalage.value, [DEPART, SEUIL_GLISSER_REPONDRE], [0.5, 1], Extrapolation.CLAMP) }],
  }));

  const [repondeur] = useState(() => {
    let franchi = false;

    function revenir() {
      if (dernier.current.animationsReduites) decalage.value = 0;
      else decalage.value = withTiming(0, { duration: DUREE_RETOUR, easing: Easing.out(Easing.cubic) });
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => dernier.current.actif && g.dx > DEPART && g.dx > Math.abs(g.dy) * 2,
      onPanResponderGrant: () => {
        franchi = false;
        cancelAnimation(decalage);
        noterGlissementReponse();
      },
      onPanResponderMove: (_, g) => {
        const position = suivreDoigt(g.dx);
        decalage.value = position;
        if (!franchi && position >= SEUIL_GLISSER_REPONDRE) {
          franchi = true;
          vibrerLegerement();
        } else if (franchi && position < SEUIL_GLISSER_REPONDRE) {
          franchi = false;
        }
      },
      onPanResponderRelease: (_, g) => {
        noterGlissementReponse();
        revenir();
        if (suivreDoigt(g.dx) >= SEUIL_GLISSER_REPONDRE) dernier.current.onRepondre();
      },
      onPanResponderTerminate: revenir,
      onPanResponderTerminationRequest: () => false,
    });
  });

  return { panHandlers: repondeur.panHandlers, styleContenu, styleIcone };
}
