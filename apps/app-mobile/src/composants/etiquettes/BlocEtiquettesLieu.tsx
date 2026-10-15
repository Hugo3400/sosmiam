import { memo, useState } from "react";
import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { FeuilleProposerEtiquette } from "~/composants/etiquettes/FeuilleProposerEtiquette";
import { LegendeEtiquettes } from "~/composants/etiquettes/LegendeEtiquettes";
import { PastilleEtiquette } from "~/composants/etiquettes/PastilleEtiquette";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEtiquettesLieu } from "~/hooks/utiliser-etiquettes-lieu";

type Props = { lieu: Lieu };

export const BlocEtiquettesLieu = memo(function BlocEtiquettesLieu({ lieu }: Props) {
  const { disponible, etiquettes, proposer } = utiliserEtiquettesLieu(lieu.id);
  const [feuille, setFeuille] = useState(false);
  const [merci, setMerci] = useState(false);
  if (!disponible) return null;

  const envoyer = (nom: string) => {
    void proposer(nom);
    setMerci(true);
    annoncerLecteurEcran(TEXTES_ETIQUETTES.merci);
  };

  return (
    <View className="gap-3 px-5 pt-6">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {TEXTES_ETIQUETTES.titre}
        </Text>
        <Text className="font-texte text-sm leading-5 text-gris">
          {lierPonctuation(lieu.verifie === false ? TEXTES_ETIQUETTES.lieuNonVerifie : TEXTES_ETIQUETTES.lieuVerifie)}
        </Text>
      </View>
      {etiquettes.length > 0 ? (
        <>
          <View className="flex-row flex-wrap gap-1.5">
            {etiquettes.map((etiquette) => (
              <PastilleEtiquette key={etiquette.nom} etiquette={etiquette} />
            ))}
          </View>
          <LegendeEtiquettes />
        </>
      ) : (
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(TEXTES_ETIQUETTES.aucune)}</Text>
      )}
      <View className="flex-row items-center gap-3">
        <Bouton petit variante="blanc" libelle={TEXTES_ETIQUETTES.proposer} libelleLu="Proposer une étiquette" indice={TEXTES_ETIQUETTES.indiceProposer} onPress={() => setFeuille(true)} />
        {merci ? (
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-1 font-texte-semi text-sm text-encre">
            {lierPonctuation(TEXTES_ETIQUETTES.merci)}
          </Text>
        ) : null}
      </View>
      <FeuilleProposerEtiquette visible={feuille} nomLieu={lieu.nom} presentes={etiquettes} onProposer={envoyer} onFermer={() => setFeuille(false)} />
    </View>
  );
});
