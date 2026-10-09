import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Rien en attente au comptoir : une phrase calme, et le rappel de ce qui arrivera ici. */
export function ComptoirVide() {
  const texte = "Rien en attente. Le calme avant le rush : les additions demandées dans l'app arriveront ici, avec leur code.";
  return (
    <View accessible accessibilityLabel={texte} className="items-center gap-2 rounded-carte border-2 border-dashed border-gris/40 px-5 py-6">
      <Text className="text-3xl">🍽️</Text>
      <Text className="text-center font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation(texte)}</Text>
    </View>
  );
}
