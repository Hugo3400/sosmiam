import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  titre: string;
  texte: string;
  indice: string;
  onReessayer: () => Promise<void>;
};

const DUREE_MINIMUM_RELANCE_MS = 800;

export function MessageLectureRatee({ titre, texte, indice, onReessayer }: Props) {
  const [relance, setRelance] = useState(false);

  async function reessayer() {
    setRelance(true);
    try {
      await Promise.all([onReessayer(), new Promise<void>((fin) => setTimeout(fin, DUREE_MINIMUM_RELANCE_MS))]);
    } finally {
      setRelance(false);
    }
  }

  return (
    <View accessibilityLiveRegion="polite" className="w-full items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        📡
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
      <Bouton
        libelle={relance ? "On retente…" : "Réessayer"}
        variante="blanc"
        petit
        desactive={relance}
        indice={indice}
        className="mt-2"
        onPress={() => void reessayer()}
      />
    </View>
  );
}
