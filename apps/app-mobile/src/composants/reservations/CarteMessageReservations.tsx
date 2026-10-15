import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  emoji: string;
  titre: string;
  texte: string;
  action?: { libelle: string; indice: string; onPress: () => void };
};

export function CarteMessageReservations({ emoji, titre, texte, action }: Props) {
  return (
    <View className="items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        {emoji}
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
      {action ? <Bouton libelle={action.libelle} variante="blanc" petit className="mt-2" indice={action.indice} onPress={action.onPress} /> : null}
    </View>
  );
}
