import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** La carte d'une section encore vide : une phrase qui donne envie, sans culpabiliser */
export function SectionVideScan({ emoji, texte }: { emoji: string; texte: string }) {
  return (
    <View accessible accessibilityLabel={texte} className="flex-row items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-4 py-4">
      <Text className="text-2xl">{emoji}</Text>
      <Text className="flex-1 font-texte text-sm leading-5 text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );
}
