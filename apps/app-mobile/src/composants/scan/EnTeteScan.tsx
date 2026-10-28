import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { TEXTES_SCAN_PAR_LANGUE } from "~/contenus/textes-scan";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** En-tête de l'onglet : le titre et la promesse */
export function EnTeteScan({ enPlus }: { enPlus?: ReactNode }) {
  const T = utiliserTextes(TEXTES_SCAN_PAR_LANGUE);
  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text accessibilityRole="header" className="font-titre text-4xl text-encre">
          {T.titre}
        </Text>
        <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(T.promesse)}</Text>
      </View>
      {enPlus}
    </View>
  );
}
