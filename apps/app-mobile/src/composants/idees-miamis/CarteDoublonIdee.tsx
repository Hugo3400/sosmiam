import { useEffect } from "react";
import { Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  idee: IdeeMiamis;
  onVoter: () => void;
  onVoir: () => void;
  onPasPareil: () => void;
};

export function CarteDoublonIdee({ idee, onVoter, onVoir, onPasPareil }: Props) {
  const texte = idee.aVote ? TEXTES_IDEES.doublonDejaVote(idee.titre) : TEXTES_IDEES.doublon(idee.titre, idee.votes);

  useEffect(() => {
    annoncerLecteurEcran(texte);
  }, [texte]);

  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      <View className="flex-row flex-wrap gap-3">
        {idee.aVote ? (
          <Bouton libelle={TEXTES_IDEES.voirDoublon} variante="encre" petit onPress={onVoir} />
        ) : (
          <Bouton libelle={TEXTES_IDEES.voterDoublon} variante="encre" petit onPress={onVoter} />
        )}
        <Bouton libelle={TEXTES_IDEES.pasPareil} variante="blanc" petit onPress={onPasPareil} />
      </View>
    </View>
  );
}
