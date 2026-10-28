import { Text, View } from "react-native";

import { ECRAN_COMPTOIR_MIAM_SAFE } from "~/contenus/ecran-comptoir-miam-safe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const CONSIGNE = lierPonctuation(ECRAN_COMPTOIR_MIAM_SAFE.consigne);

export function ConsigneComptoirMiamSafe() {
  return (
    <View className="flex-1 justify-center gap-6 px-8">
      <Text accessibilityRole="header" accessibilityLanguage="fr-FR" className="font-titre-gras text-4xl leading-[44px] text-lait">
        {ECRAN_COMPTOIR_MIAM_SAFE.besoinAide}
      </Text>
      <Text accessibilityLanguage="fr-FR" className="font-texte-semi text-2xl leading-8 text-lait">
        {CONSIGNE}
      </Text>
    </View>
  );
}
