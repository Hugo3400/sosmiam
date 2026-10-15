import { useEffect, useRef } from "react";
import type { Text } from "react-native";

import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { MessageEchecVisite } from "~/composants/visites/MessageEchecVisite";
import type { RefusOuvertureAvis as Refus } from "~/fonctions/avis/choisir-refus-ouverture-avis";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";

type Props = {
  refus: Refus;
  nomLieu?: string;
  onRetour: () => void;
};

const DELAI_FOCUS_MS = 450;

export function RefusOuvertureAvis({ refus, nomLieu, onRetour }: Props) {
  const refTitre = useRef<Text>(null);
  const cle = `${refus.erreur}|${refus.titre ?? ""}`;

  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_MS);
    return () => clearTimeout(minuterie);
  }, [cle]);

  return (
    <EcranReglage centre onRetour={onRetour}>
      <MessageEchecVisite
        erreur={refus.erreur}
        details={refus.details}
        lieuNom={nomLieu}
        titre={refus.titre}
        texte={refus.texte}
        refTitre={refTitre}
        actions={[{ libelle: TEXTES_DONNER_AVIS.retourVisite, onPress: onRetour }]}
      />
    </EcranReglage>
  );
}
