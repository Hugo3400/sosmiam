import { Text } from "react-native";

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
      <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(TEXTES_PALIER.explication)}</Text>
    </FeuilleBas>
  );
}
