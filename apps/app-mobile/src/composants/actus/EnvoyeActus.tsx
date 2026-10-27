import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";

type Props = { titre: string; texte: string; mesArticles: string; retour: string; onMesArticles: () => void; onRetour: () => void };

export function EnvoyeActus({ titre, texte, mesArticles, retour, onMesArticles, onRetour }: Props) {
  return (
    <View className="flex-1 justify-center gap-4 px-6">
      <Text accessibilityRole="header" className="font-titre text-3xl leading-9 text-encre">
        {titre}
      </Text>
      <Text className="font-texte text-base leading-6 text-gris">{texte}</Text>
      <Bouton libelle={mesArticles} onPress={onMesArticles} className="mt-2" />
      <Bouton libelle={retour} variante="blanc" onPress={onRetour} />
    </View>
  );
}
