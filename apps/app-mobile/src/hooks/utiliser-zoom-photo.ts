import { useEffect, useRef, useState } from "react";
import { PanResponder, type GestureResponderEvent } from "react-native";
import { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

import { bornerDecalageZoom } from "~/fonctions/chat/borner-decalage-zoom";
import { calculerZoomPincement, ZOOM_MIN } from "~/fonctions/chat/calculer-zoom-pincement";

const ZOOM_BOUTON = 2.5;
const SEUIL_ZOOME = 1.02;
const DUREE = 200;

const ecartDesDoigts = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
};

export function utiliserZoomPhoto(largeur: number, hauteur: number, onZoom: (zoome: boolean) => void) {
  const animationsReduites = useReducedMotion();
  const zoom = useSharedValue(ZOOM_MIN);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const dernier = useRef({ largeur, hauteur, onZoom, animationsReduites });
  const miroir = useRef({ zoom: ZOOM_MIN, x: 0, y: 0 });

  useEffect(() => {
    dernier.current = { largeur, hauteur, onZoom, animationsReduites };
  });

  const [outils] = useState(() => {
    let depart = { zoom: ZOOM_MIN, ecart: 0, x: 0, y: 0, pince: false };

    const poser = (z: number, nx: number, ny: number, anime: boolean) => {
      const { largeur: l, hauteur: h, animationsReduites: reduites } = dernier.current;
      const bx = bornerDecalageZoom(nx, z, l);
      const by = bornerDecalageZoom(ny, z, h);
      const avant = miroir.current.zoom > SEUIL_ZOOME;
      miroir.current = { zoom: z, x: bx, y: by };
      if (anime && !reduites) {
        zoom.value = withTiming(z, { duration: DUREE });
        x.value = withTiming(bx, { duration: DUREE });
        y.value = withTiming(by, { duration: DUREE });
      } else {
        cancelAnimation(zoom);
        zoom.value = z;
        x.value = bx;
        y.value = by;
      }
      if (avant !== z > SEUIL_ZOOME) dernier.current.onZoom(z > SEUIL_ZOOME);
    };

    const finir = () => {
      const m = miroir.current;
      if (m.zoom <= SEUIL_ZOOME) poser(ZOOM_MIN, 0, 0, true);
    };

    const repondeur = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (e, g) => e.nativeEvent.touches.length >= 2 || (miroir.current.zoom > SEUIL_ZOOME && Math.abs(g.dx) + Math.abs(g.dy) > 4),
      onPanResponderGrant: (e) => {
        const m = miroir.current;
        const ecart = ecartDesDoigts(e);
        depart = { zoom: m.zoom, ecart, x: m.x, y: m.y, pince: ecart > 0 };
      },
      onPanResponderMove: (e, g) => {
        const m = miroir.current;
        if (e.nativeEvent.touches.length >= 2) {
          const ecart = ecartDesDoigts(e);
          if (!depart.pince) depart = { zoom: m.zoom, ecart, x: m.x, y: m.y, pince: true };
          poser(calculerZoomPincement(depart.zoom, depart.ecart, ecart), m.x, m.y, false);
          return;
        }
        if (depart.pince) depart = { ...depart, x: m.x - g.dx, y: m.y - g.dy, pince: false };
        if (m.zoom > SEUIL_ZOOME) poser(m.zoom, depart.x + g.dx, depart.y + g.dy, false);
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderRelease: finir,
      onPanResponderTerminate: finir,
    });

    return {
      repondeur,
      basculer: () => (miroir.current.zoom > SEUIL_ZOOME ? poser(ZOOM_MIN, 0, 0, true) : poser(ZOOM_BOUTON, 0, 0, true)),
      remettre: () => poser(ZOOM_MIN, 0, 0, false),
    };
  });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: zoom.value }] }));

  return { panHandlers: outils.repondeur.panHandlers, style, basculer: outils.basculer, remettre: outils.remettre };
}
