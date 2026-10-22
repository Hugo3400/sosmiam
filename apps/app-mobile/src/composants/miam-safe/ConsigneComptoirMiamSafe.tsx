import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const CONSIGNE = lierPonctuation(
  "Je ne me sens pas en sécurité. Accompagne-moi à l'écart, sans bruit, et demande-moi ce qu'il me faut : un taxi, appeler un proche, les secours.",
);

export function ConsigneComptoirMiamSafe() {
  return (
    <View className="flex-1 justify-center gap-6 px-8">
      <Text accessibilityRole="header" className="font-titre-gras text-4xl leading-[44px] text-lait">
        J'ai besoin d'aide, discrètement.
      </Text>
      <Text className="font-texte-semi text-2xl leading-8 text-lait">
        {CONSIGNE}
      </Text>
    </View>
  );
}
