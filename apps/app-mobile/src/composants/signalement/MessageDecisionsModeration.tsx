import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Grand emoji décoratif (pas lu) */
  emoji: string;
  titre: string;
  texte: string;
  /** Un bouton sous le texte (« Réessayer », « Créer mon compte ») */
  children?: ReactNode;
};

/** Le message au milieu de « Décisions de la modération » : aucune décision, lecture ratée, ou pas de compte (démo, visite). */
export function MessageDecisionsModeration({ emoji, titre, texte, children }: Props) {
  return (
    <View accessibilityLiveRegion="polite" className="items-center gap-2 px-2 py-6">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        {emoji}
      </Text>
      <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
      {children}
    </View>
  );
}
