import { useEffect } from "react";
import { Text, View } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  idee: IdeeMiamis;
  onVoter: () => void;
  onVoir: () => void;
  onPasPareil: () => void;
};

export function CarteDoublonIdee({ idee, onVoter, onVoir, onPasPareil }: Props) {
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const texte = idee.aVote ? T.doublonDejaVote(idee.titre) : T.doublon(idee.titre, idee.votes);

  useEffect(() => {
    annoncerLecteurEcran(texte);
  }, [texte]);

  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      <View className="flex-row flex-wrap gap-3">
        {idee.aVote ? (
          <Bouton libelle={T.voirDoublon} variante="encre" petit onPress={onVoir} />
        ) : (
          <Bouton libelle={T.voterDoublon} variante="encre" petit onPress={onVoter} />
        )}
        <Bouton libelle={T.pasPareil} variante="blanc" petit onPress={onPasPareil} />
      </View>
    </View>
  );
}
