import { Text, View } from "react-native";

import { PHRASE_MIAM_SAFE } from "@sos-miam/commun/regles/miam-safe";
import { Mascotte } from "~/composants/marque/Mascotte";

export function PhraseComptoirMiamSafe() {
  return (
    <View className="flex-1 items-center justify-center gap-5 px-8">
      <Mascotte expression="clin" taille={150} />
      <View className="rounded-full border-2 border-jaune px-3 py-1">
        <Text className="font-texte-gras text-sm text-jaune">🛡 Miam Safe</Text>
      </View>
      <Text accessibilityRole="header" className="text-center font-titre-gras text-4xl text-creme">
        {PHRASE_MIAM_SAFE}
      </Text>
      <Text className="max-w-[280px] text-center font-texte-semi text-sm leading-5 text-gris-nuit">
        Pour l'équipe : cette personne a besoin d'aide. Accompagne-la à l'écart, sans bruit, et demande-lui ce qu'il lui faut.
      </Text>
    </View>
  );
}
