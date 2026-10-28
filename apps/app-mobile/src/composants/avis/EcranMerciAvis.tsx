import { useEffect, useRef } from "react";
import type { Text } from "react-native";

import { lieuEvoqueAlcool } from "@sos-miam/commun/fonctions/prevention/lieu-evoque-alcool";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import type { Visite } from "@sos-miam/commun/types/visite";
import { MerciAvis } from "~/composants/avis/MerciAvis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import type { AvisEnvoye, PhotoAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visite: Visite;
  envoye: AvisEnvoye;
  photo: PhotoAvis | null;
  onTerminer: () => void;
  onMesVisites: () => void;
};

const DELAI_FOCUS_MS = 450;

export function EcranMerciAvis({ visite, envoye, photo, onTerminer, onMesVisites }: Props) {
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const { profil } = utiliserProfil();
  const { lieu } = utiliserLieuParId(visite.lieu.id);
  const refTitre = useRef<Text>(null);
  const lieuAlcool = lieu ? lieuEvoqueAlcool(lieu) : visite.lieu.type === "bar";
  const avecPhoto = envoye.avis ? envoye.avis.photo !== null : photo !== null;

  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_MS);
    return () => clearTimeout(minuterie);
  }, []);

  return (
    <EcranReglage onRetour={onTerminer} boutonPrincipal={{ libelle: T.merciTermine, onPress: onTerminer }}>
      <MerciAvis
        prenom={profil?.prenom ?? envoye.avis?.signature ?? ""}
        nomLieu={visite.lieu.nom}
        avis={envoye.avis}
        sourcePhoto={avecPhoto && photo ? { uri: photo.uri } : null}
        pointsGagnes={envoye.pointsGagnes}
        repasOffert={visite.reglement?.type === "offert"}
        alcool={lieuAlcool || parleDAlcool(envoye.avis?.texte)}
        refTitre={refTitre}
        onMesVisites={onMesVisites}
      />
    </EcranReglage>
  );
}
