import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { REGLES_SORTIE_MIAMIS_PAR_LANGUE, TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ReglesSortieMiamis() {
  const regles = utiliserTextes(REGLES_SORTIE_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  return (
    <View className="gap-2.5 rounded-carte border-2 border-ligne bg-carte px-4 py-3.5">
      <Text accessibilityRole="header" className="font-texte-gras text-[15px] text-encre">
        {T.reglesTitre}
      </Text>
      {regles.map((regle) => (
        <View key={regle} className="flex-row items-start gap-2.5">
          <Ionicons name="checkmark" size={16} color={couleurs.vert} style={{ marginTop: 2 }} />
          <Text className="flex-1 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(regle)}</Text>
        </View>
      ))}
    </View>
  );
}
