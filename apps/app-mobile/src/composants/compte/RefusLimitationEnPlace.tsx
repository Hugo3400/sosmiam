import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { CARTE_REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** La phrase du geste (REFUS_LIMITATION) ; null : rien à dire */
  texte: string | null;
};

/**
 * Juste au-dessus du bouton d'un geste qu'un compte limité ne peut pas faire (mode pro : SOS du soir, message du moment,
 * événement, fiche, carte, carte de fidélité) : la phrase reste là jusqu'au prochain essai. L'annonce de l'écran, en haut,
 * passerait sous celle de toute l'app (« Voir pourquoi ») ou hors de vue quand la page défile. Ni panne, ni « Réessaie ».
 */
export function RefusLimitationEnPlace({ texte }: Props) {
  const carte = utiliserTextes(CARTE_REFUS_LIMITATION_PAR_LANGUE);
  useEffect(() => {
    if (texte) AccessibilityInfo.announceForAccessibility(texte);
  }, [texte]);

  if (!texte) return null;
  return (
    <View accessible accessibilityLabel={texte} className="flex-row gap-2 rounded-2xl border-2 border-encre bg-jaune-clair px-3.5 py-2.5">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-base">
        {carte.emoji}
      </Text>
      <Text className="flex-1 font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
    </View>
  );
}
