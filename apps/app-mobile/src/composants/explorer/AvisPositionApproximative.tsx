import { useEffect } from "react";
import { AccessibilityInfo, Linking, Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  onFermer: () => void;
};

export function AvisPositionApproximative({ onFermer }: Props) {
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE).approximative;
  const annonce = `${T.titre}. ${T.texte}`;
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(annonce, { queue: true });
    else if (Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(annonce);
  }, [annonce]);

  function ouvrirReglages() {
    onFermer();
    Linking.openSettings().catch(() => {});
  }

  return (
    <View className="gap-2 rounded-carte border-2 border-encre bg-jaune-clair p-3">
      <Text accessibilityRole="header" accessibilityLabel={T.titre} className="font-texte-gras text-[15px] text-encre">
        🔭 {T.titre}
      </Text>
      <Text className="font-texte text-[14px] leading-5 text-encre">{lierPonctuation(T.texte)}</Text>
      <View className="flex-row flex-wrap gap-3 pt-1">
        <Bouton libelle={T.ouvrirReglages} indice={T.ouvrirReglagesIndice} petit onPress={ouvrirReglages} />
        <Bouton libelle={T.plusTard} variante="blanc" indice={T.plusTardIndice} petit onPress={onFermer} />
      </View>
    </View>
  );
}
