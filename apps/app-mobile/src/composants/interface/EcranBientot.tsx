import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import couleurs from "~/theme/couleurs";

type Props = { emoji: string; titre: string; texte: string };

/** Écran provisoire d'un onglet pas encore développé. */
export function EcranBientot({ emoji, titre, texte }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <Text className="text-6xl">{emoji}</Text>
        <Text className="text-center font-titre text-3xl text-encre">{titre}</Text>
        <Text className="text-center font-texte text-base text-gris">{texte}</Text>
        <View className="mt-4 rounded-full border-2 border-encre bg-jaune px-5 py-2">
          <Text className="font-texte-gras text-encre">Bientôt dans l'app</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
