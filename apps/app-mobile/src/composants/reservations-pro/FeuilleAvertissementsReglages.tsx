import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { CONFIRMATIONS_REGLAGES_RESERVATIONS, TEXTES_AVERTISSEMENTS_REGLAGES } from "~/contenus/textes-reglages-reservations";
import type { AvertissementReglages } from "~/fonctions/reservations/lister-avertissements-reglages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  avertissements: readonly AvertissementReglages[];
  onEnregistrer: () => void;
  onFermer: () => void;
};

const T = CONFIRMATIONS_REGLAGES_RESERVATIONS.avertissements;

export function FeuilleAvertissementsReglages({ visible, avertissements, onEnregistrer, onFermer }: Props) {
  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={T.confirmer} variante="encre" onPress={onEnregistrer} />
          <Bouton libelle={T.rester} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="gap-3">
        {avertissements.map((a) => (
          <View key={a.cle} accessible className="flex-row items-start gap-3 rounded-2xl border-2 border-ligne bg-carte px-3.5 py-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
              {a.emoji}
            </Text>
            <Text className="flex-1 font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(a.texte)}</Text>
          </View>
        ))}
      </View>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_AVERTISSEMENTS_REGLAGES.note)}</Text>
    </FeuilleBas>
  );
}
