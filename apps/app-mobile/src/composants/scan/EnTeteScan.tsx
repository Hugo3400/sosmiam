import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** En-tête de l'onglet : le titre et la promesse */
export function EnTeteScan({ enPlus }: { enPlus?: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text accessibilityRole="header" className="font-titre text-4xl text-encre">
          Scan
        </Text>
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Ta visite compte quand tu paies : c'est ce qui rend les avis vrais.")}</Text>
      </View>
      {enPlus}
    </View>
  );
}
