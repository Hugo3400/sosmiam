import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PanResponder, type LayoutChangeEvent, type PanResponderGestureState } from "react-native";
import { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const SEUIL_DEPART = 6;
const DEPLACEMENT_MIN = 12;
const PART_DE_LA_HAUTEUR = 0.25;
const SEUIL_MIN = 48;
const SEUIL_MAX = 80;
const ELAN = 150;
const DUREE_RETOUR = 220;
const DUREE_SORTIE = 180;
const ATTENTE_FERMETURE = 450;

type Options = { sortieAnimee?: boolean };

export function utiliserGlisserPourFermer(visible: boolean, onFermer: () => void, { sortieAnimee = false }: Options = {}) {
  const animationsReduites = useReducedMotion();
  const decalage = useSharedValue(0);
  const styleFeuille = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.value }] }));
  const hauteur = useRef(0);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernier = useRef({ visible, onFermer, animationsReduites, sortieAnimee });

  useEffect(() => {
    dernier.current = { visible, onFermer, animationsReduites, sortieAnimee };
  });

  useLayoutEffect(() => {
    if (!visible) return;
    cancelAnimation(decalage);
    decalage.value = 0;
  }, [visible, decalage]);

  useEffect(
    () => () => {
      if (minuterie.current) clearTimeout(minuterie.current);
    },
    [],
  );

  const [repondeur] = useState(() => {
    const prise = { base: 0, depart: 0 };
    const lireDecalage = (g: PanResponderGestureState) => Math.max(0, prise.base + g.dy - prise.depart);

    function revenir() {
      decalage.value = withTiming(0, { duration: DUREE_RETOUR, easing: Easing.out(Easing.cubic) });
    }

    function demanderFermeture() {
      dernier.current.onFermer();
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => {
        if (dernier.current.visible) revenir();
      }, ATTENTE_FERMETURE);
    }

    function fermer() {
      if (!dernier.current.sortieAnimee || dernier.current.animationsReduites || hauteur.current <= 0) return demanderFermeture();
      decalage.value = withTiming(hauteur.current, { duration: DUREE_SORTIE, easing: Easing.in(Easing.cubic) }, (fini) => {
        if (fini) scheduleOnRN(demanderFermeture);
      });
    }

    function terminer(g: PanResponderGestureState, relache: boolean) {
      const fin = lireDecalage(g);
      const seuil = Math.min(SEUIL_MAX, Math.max(SEUIL_MIN, hauteur.current * PART_DE_LA_HAUTEUR));
      if (relache && fin > DEPLACEMENT_MIN && fin + g.vy * ELAN > seuil) fermer();
      else if (!dernier.current.animationsReduites) revenir();
    }

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => dernier.current.visible && g.dy > SEUIL_DEPART && g.dy > Math.abs(g.dx),
      onPanResponderGrant: (_, g) => {
        if (minuterie.current) clearTimeout(minuterie.current);
        cancelAnimation(decalage);
        prise.base = dernier.current.animationsReduites ? 0 : decalage.value;
        prise.depart = g.dy;
      },
      onPanResponderMove: (_, g) => {
        if (!dernier.current.animationsReduites) decalage.value = lireDecalage(g);
      },
      onPanResponderRelease: (_, g) => terminer(g, true),
      onPanResponderTerminate: (_, g) => terminer(g, false),
      onPanResponderTerminationRequest: () => false,
    });
  });

  function mesurerFeuille(evenement: LayoutChangeEvent) {
    hauteur.current = evenement.nativeEvent.layout.height;
  }

  return { panHandlers: repondeur.panHandlers, styleFeuille, mesurerFeuille };
}

export type GlisserPourFermer = ReturnType<typeof utiliserGlisserPourFermer>;
