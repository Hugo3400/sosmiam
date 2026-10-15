import { useState } from "react";
import { Text, View } from "react-native";

import { FAMILLES_ETIQUETTES } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { LONGUEUR_MAX_ETIQUETTE_LIBRE } from "@sos-miam/commun/regles/etiquettes";
import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import { FamilleEtiquettesAChoisir } from "~/composants/etiquettes/FamilleEtiquettesAChoisir";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";
import { preparerPropositionEtiquette } from "~/fonctions/etiquettes/preparer-proposition-etiquette";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  nomLieu: string;
  presentes: readonly EtiquetteLieu[];
  onProposer: (nom: string) => void;
  onFermer: () => void;
};

export function FeuilleProposerEtiquette({ visible, nomLieu, presentes, onProposer, onFermer }: Props) {
  const [choisie, setChoisie] = useState<string | null>(null);
  const [libre, setLibre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const fermer = () => {
    setChoisie(null);
    setLibre("");
    setErreur(null);
    onFermer();
  };

  const proposer = () => {
    const preparee = preparerPropositionEtiquette(choisie, libre, presentes);
    if (!preparee.ok) {
      setErreur(preparee.message);
      return;
    }
    onProposer(preparee.nom);
    fermer();
  };

  return (
    <FeuilleBas
      visible={visible}
      titre={TEXTES_ETIQUETTES.feuilleTitre}
      sousTitre={lierPonctuation(TEXTES_ETIQUETTES.feuilleSousTitre(nomLieu))}
      onFermer={fermer}
      pied={
        <View className="flex-row gap-3">
          <Bouton className="flex-1" libelle={TEXTES_ETIQUETTES.annuler} variante="blanc" onPress={fermer} />
          <Bouton className="flex-1" libelle={TEXTES_ETIQUETTES.envoyer} desactive={choisie === null && libre.trim() === ""} onPress={proposer} />
        </View>
      }
    >
      <View className="gap-5">
        {FAMILLES_ETIQUETTES.map((famille) => (
          <FamilleEtiquettesAChoisir
            key={famille.id}
            famille={famille}
            choisie={libre.trim() === "" ? choisie : null}
            onChoisir={(nom) => {
              setChoisie(nom === choisie ? null : nom);
              setLibre("");
              setErreur(null);
            }}
          />
        ))}
        <ChampTexte
          libelle={TEXTES_ETIQUETTES.libre}
          mention={TEXTES_ETIQUETTES.libreMention}
          valeur={libre}
          onChangeTexte={(texte) => {
            setLibre(texte);
            if (texte.trim() !== "") setChoisie(null);
            setErreur(null);
          }}
          placeholder={TEXTES_ETIQUETTES.librePlaceholder}
          maxLength={LONGUEUR_MAX_ETIQUETTE_LIBRE}
          returnKeyType="done"
          onSubmitEditing={proposer}
          erreur={libre.trim() !== "" ? erreur : null}
        />
        {erreur && libre.trim() === "" ? (
          <Text accessibilityLiveRegion="polite" className="font-texte-semi text-sm text-rouge-texte">
            {lierPonctuation(erreur)}
          </Text>
        ) : null}
      </View>
    </FeuilleBas>
  );
}
