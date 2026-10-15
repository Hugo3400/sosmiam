import { useState } from "react";
import { Text } from "react-native";

import { FAMILLES_ETIQUETTES } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { FamilleEtiquettesACocher } from "~/composants/miamis/FamilleEtiquettesACocher";
import { TEXTES_MES_ENVIES } from "~/contenus/textes-miamis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  envies: string[];
  onEnregistrer: (envies: string[]) => void;
  onFermer: () => void;
};

export function FeuilleMesEnvies({ visible, envies, onEnregistrer, onFermer }: Props) {
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
      titre={TEXTES_MES_ENVIES.titre}
      sousTitre={TEXTES_MES_ENVIES.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={TEXTES_MES_ENVIES.enregistrer} onPress={() => onEnregistrer(brouillon)} />
          <Bouton libelle={TEXTES_MES_ENVIES.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      {FAMILLES_ETIQUETTES.map((famille) => (
        <FamilleEtiquettesACocher key={famille.id} famille={famille} choisies={brouillon} onBasculer={basculer} />
      ))}
      <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(TEXTES_MES_ENVIES.note)}</Text>
    </FeuilleBas>
  );
}
