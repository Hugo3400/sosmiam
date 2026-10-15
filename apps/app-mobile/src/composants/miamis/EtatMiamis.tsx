import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  emoji: string;
  titre: string;
  texte: string;
  action?: { libelle: string; onPress: () => void };
};

export function EtatMiamis({ emoji, titre, texte, action }: Props) {
  return (
    <View className="items-center gap-3 rounded-3xl border-2 border-dashed border-gris/40 bg-white/70 px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        {emoji}
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
      {action ? <Bouton libelle={action.libelle} variante="blanc" petit onPress={action.onPress} className="mt-2" /> : null}
    </View>
  );
}
