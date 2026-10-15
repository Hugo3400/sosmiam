import { useEffect } from "react";
import { AccessibilityInfo, Linking, Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  onFermer: () => void;
};

const TITRE = "Le Capitaine te voit un peu flou";
const TEXTE = "Ta position est approximative : active Position exacte pour SOS Miam dans les réglages, pour des distances au mètre près.";

export function AvisPositionApproximative({ onFermer }: Props) {
  useEffect(() => {
    const texte = `${TITRE}. ${TEXTE}`;
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
    else if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(texte);
  }, []);

  function ouvrirReglages() {
    onFermer();
    Linking.openSettings().catch(() => {});
  }

  return (
    <View className="gap-2 rounded-carte border-2 border-encre bg-jaune-clair p-3">
      <Text accessibilityRole="header" accessibilityLabel={TITRE} className="font-texte-gras text-[15px] text-encre">
        🔭 {TITRE}
      </Text>
      <Text className="font-texte text-[14px] leading-5 text-encre">{lierPonctuation(TEXTE)}</Text>
      <View className="flex-row flex-wrap gap-3 pt-1">
        <Bouton libelle="Ouvrir les réglages" indice="Ouvre les réglages de SOS Miam sur ton téléphone" petit onPress={ouvrirReglages} />
        <Bouton libelle="Plus tard" variante="blanc" indice="Range ce message" petit onPress={onFermer} />
      </View>
    </View>
  );
}
