import { memo, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  cle: string;
  nombre: number;
  latitude: number;
  longitude: number;
  onPress: (cle: string) => void;
};

const COTE = 64;
const DUREE_SUIVI = 500;
const DECALAGE_OMBRE = 3;

export const MarqueurGroupe = memo(function MarqueurGroupe({ cle, nombre, latitude, longitude, onPress }: Props) {
  const [nombreFige, setNombreFige] = useState<number | null>(null);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const minuterie = setTimeout(() => setNombreFige(nombre), DUREE_SUIVI);
    return () => clearTimeout(minuterie);
  }, [nombre]);

  const texte = nombre > 999 ? "999+" : String(nombre);
  const diametre = nombre >= 100 ? 52 : 44;
  const autour = (COTE - diametre) / 2;

  return (
    <Marker
      identifier={`groupe-${cle}`}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={0}
      tracksViewChanges={nombre !== nombreFige}
      stopPropagation
      onPress={() => {
        vibrerLegerement();
        onPress(cle);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${nombre} lieux, touche pour zoomer`}
      accessibilityHint="Rapproche la carte pour les voir un par un"
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: COTE, height: COTE }} className="items-center justify-center">
        <View
          style={{ position: "absolute", left: autour + DECALAGE_OMBRE, top: autour + DECALAGE_OMBRE, width: diametre, height: diametre, borderRadius: diametre / 2 }}
          className="bg-encre"
        />
        <View
          style={{ width: diametre, height: diametre, borderRadius: diametre / 2, borderWidth: 2 }}
          className="items-center justify-center overflow-hidden border-encre bg-jaune"
        >
          <Text allowFontScaling={false} className={`font-titre text-encre ${texte.length > 3 ? "text-sm" : "text-base"}`}>
            {texte}
          </Text>
        </View>
      </View>
    </Marker>
  );
});
