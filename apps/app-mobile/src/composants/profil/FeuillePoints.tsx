import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_PALIER } from "~/contenus/textes-profil";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  onFermer: () => void;
};

export function FeuillePoints({ visible, onFermer }: Props) {
  return (
    <FeuilleBas visible={visible} titre={TEXTES_PALIER.commentGagner} onFermer={onFermer} pied={<Bouton libelle={TEXTES_PALIER.compris} onPress={onFermer} />}>
      <View className="gap-3">
        <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(TEXTES_PALIER.introPoints)}</Text>
        {TEXTES_PALIER.bareme.map((ligne) => (
          <View key={ligne.action} className="flex-row items-start gap-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl leading-6">
              {ligne.emoji}
            </Text>
            <Text className="flex-1 font-texte text-base leading-6 text-encre">
              {lierPonctuation(`${ligne.action} : `)}
              <Text className="font-texte-gras">{ligne.gain}</Text>
            </Text>
          </View>
        ))}
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_PALIER.repasOffert)}</Text>
      </View>
    </FeuilleBas>
  );
}
