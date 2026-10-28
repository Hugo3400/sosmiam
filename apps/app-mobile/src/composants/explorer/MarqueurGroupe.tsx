import { memo, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { DIAMETRE_GROSSE_BULLE_POINTS, DIAMETRE_MARQUEUR_POINTS, NOMBRE_GROSSE_BULLE } from "~/contenus/regroupement-carte";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterNombreCourtLangue } from "~/fonctions/langue/formater-nombre-court-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserTheme } from "~/hooks/utiliser-theme";

type Props = {
  cle: string;
  nombre: number;
  latitude: number;
  longitude: number;
  devant: boolean;
  onPress: (cle: string) => void;
};

const COTE = 50;
const DUREE_SUIVI = 500;
const DECALAGE_OMBRE = 3;
const PLAN_DEVANT = 4;

export const MarqueurGroupe = memo(function MarqueurGroupe({ cle, nombre, latitude, longitude, devant, onPress }: Props) {
  const { schema } = utiliserTheme();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE).marqueurs;
  const apparence = `${nombre}|${schema}|${langue}`;
  const [apparenceFigee, setApparenceFigee] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const minuterie = setTimeout(() => setApparenceFigee(apparence), DUREE_SUIVI);
    return () => clearTimeout(minuterie);
  }, [apparence]);

  const texte = formaterNombreCourtLangue(nombre, langue).replace(" ", "\u202f");
  const diametre = nombre >= NOMBRE_GROSSE_BULLE ? DIAMETRE_GROSSE_BULLE_POINTS : DIAMETRE_MARQUEUR_POINTS;
  const autour = (COTE - diametre) / 2;
  const police = texte.length <= 2 ? "text-base" : texte.length === 3 ? "text-[15px]" : "text-xs";

  return (
    <Marker
      identifier={`groupe-${cle}`}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={devant ? PLAN_DEVANT : 0}
      tracksViewChanges={apparence !== apparenceFigee}
      stopPropagation
      onPress={() => {
        vibrerLegerement();
        onPress(cle);
      }}
      accessibilityRole="button"
      accessibilityLabel={T.groupeLu(nombre)}
      accessibilityHint={T.groupeIndice}
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
          <Text allowFontScaling={false} className={`font-titre text-nuit ${police}`}>
            {texte}
          </Text>
        </View>
      </View>
    </Marker>
  );
});
