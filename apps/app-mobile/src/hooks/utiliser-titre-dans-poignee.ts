import { useState } from "react";
import { useWindowDimensions } from "react-native";

const HAUTEUR_MIN = 480;

export function utiliserTitreDansPoignee(visible = true) {
  const { height, fontScale } = useWindowDimensions();
  const assezHaut = height / fontScale >= HAUTEUR_MIN;
  const [fige, setFige] = useState({ visible, assezHaut });
  if (visible !== fige.visible) setFige({ visible, assezHaut: visible ? assezHaut : fige.assezHaut });
  return visible && !fige.visible ? assezHaut : fige.assezHaut;
}
