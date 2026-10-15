import { useRouter } from "expo-router";
import { View } from "react-native";

import { CarteChoixRadio } from "~/composants/miamis/CarteChoixRadio";
import { TEXTES_ORGANISER } from "~/contenus/textes-sorties-miamis";

export function ChoixAvecQui() {
  const router = useRouter();
  return (
    <View accessibilityRole="radiogroup" className="gap-2.5">
      <CarteChoixRadio
        titre={TEXTES_ORGANISER.entrePotes}
        texte={TEXTES_ORGANISER.entrePotesTexte}
        choisi={false}
        position={1}
        total={2}
        onPress={() => router.replace("/potes/nouvelle-sortie")}
      />
      <CarteChoixRadio titre={TEXTES_ORGANISER.ouverte} texte={TEXTES_ORGANISER.ouverteTexte} choisi position={2} total={2} onPress={() => undefined} />
    </View>
  );
}
