import { useState } from "react";
import { Text } from "react-native";

import { FAMILLES_ETIQUETTES } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { FamilleEtiquettesACocher } from "~/composants/miamis/FamilleEtiquettesACocher";
import { TEXTES_MES_ENVIES_PAR_LANGUE } from "~/contenus/textes-miamis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  envies: string[];
  onEnregistrer: (envies: string[]) => void;
  onFermer: () => void;
};

export function FeuilleMesEnvies({ visible, envies, onEnregistrer, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_MES_ENVIES_PAR_LANGUE);
  const [brouillon, setBrouillon] = useState(envies);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) setBrouillon(envies);
  }

  const basculer = (nom: string) => setBrouillon((actuelles) => (actuelles.includes(nom) ? actuelles.filter((e) => e !== nom) : [...actuelles, nom]));

  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      sousTitre={T.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={T.enregistrer} onPress={() => onEnregistrer(brouillon)} />
          <Bouton libelle={T.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      {FAMILLES_ETIQUETTES.map((famille) => (
        <FamilleEtiquettesACocher key={famille.id} famille={famille} choisies={brouillon} onBasculer={basculer} />
      ))}
      <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(T.note)}</Text>
    </FeuilleBas>
  );
}
