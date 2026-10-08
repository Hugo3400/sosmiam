import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";

import type { PositionLieu } from "@sos-miam/commun/types/lieu";

type Props = {
  /** Ta position, lue une seule fois quand tu as touché « Autour de moi » */
  position: PositionLieu;
};

/** Le bleu habituel du « tu es ici » des cartes : on le reconnaît sans légende */
const BLEU_POSITION = "#0A84FF";
const COTE = 28;
/** Temps laissé à Android pour dessiner l'image du marqueur avant de la figer */
const DUREE_SUIVI = 500;

/**
 * « Ta position » sur la carte d'Explorer : un point bleu fixe, posé là où on t'a trouvé.
 * La carte ne suit pas tes déplacements (pas de GPS en continu) : pour te remettre à jour, retouche « Autour de moi ».
 */
export const MarqueurPosition = memo(function MarqueurPosition({ position }: Props) {
  // Android dessine le marqueur en image : on le suit le temps de le dessiner, puis on le fige
  const [fige, setFige] = useState(false);
  useEffect(() => {
    const minuterie = setTimeout(() => setFige(true), DUREE_SUIVI);
    return () => clearTimeout(minuterie);
  }, []);

  return (
    <Marker
      identifier="ta-position"
      coordinate={position}
      anchor={{ x: 0.5, y: 0.5 }}
      // Sous les lieux : un lieu tout proche de toi reste facile à toucher
      zIndex={-1}
      tracksViewChanges={!fige}
      accessibilityLabel="Ta position"
    >
      <View style={{ width: COTE, height: COTE }} className="items-center justify-center">
        <View style={{ position: "absolute", width: COTE, height: COTE, borderRadius: COTE / 2, backgroundColor: BLEU_POSITION, opacity: 0.2 }} />
        <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: BLEU_POSITION }} />
      </View>
    </Marker>
  );
});
