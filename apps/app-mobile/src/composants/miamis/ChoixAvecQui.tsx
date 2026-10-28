import { useRouter } from "expo-router";
import { View } from "react-native";

import { CarteChoixRadio } from "~/composants/miamis/CarteChoixRadio";
import { TEXTES_ORGANISER_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ChoixAvecQui() {
  const T = utiliserTextes(TEXTES_ORGANISER_PAR_LANGUE);
  const router = useRouter();
  return (
    <View accessibilityRole="radiogroup" className="gap-2.5">
      <CarteChoixRadio
        titre={T.entrePotes}
        texte={T.entrePotesTexte}
        choisi={false}
        position={1}
        total={2}
        onPress={() => router.replace("/potes/nouvelle-sortie")}
      />
      <CarteChoixRadio titre={T.ouverte} texte={T.ouverteTexte} choisi position={2} total={2} onPress={() => undefined} />
    </View>
  );
}
