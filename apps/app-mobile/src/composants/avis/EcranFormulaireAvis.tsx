import { useState } from "react";
import { Text, View } from "react-native";

import { calculerPointsPhotoAvis } from "@sos-miam/commun/fonctions/avis/calculer-points-photo-avis";
import { signerAvis } from "@sos-miam/commun/fonctions/avis/signer-avis";
import { lieuEvoqueAlcool } from "@sos-miam/commun/fonctions/prevention/lieu-evoque-alcool";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTE_AVIS_MIN } from "@sos-miam/commun/regles/avis";
import type { NoteAvis } from "@sos-miam/commun/types/avis";
import type { Visite } from "@sos-miam/commun/types/visite";
import { CarteVisiteAvis } from "~/composants/avis/CarteVisiteAvis";
import { EncadreAvis } from "~/composants/avis/EncadreAvis";
import { EncadreRefusEnvoiAvis } from "~/composants/avis/EncadreRefusEnvoiAvis";
import { FormulaireAvis } from "~/composants/avis/FormulaireAvis";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { decrireRefusPhotoAvis } from "~/fonctions/avis/decrire-refus-photo-avis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { EtatEnvoiAvis } from "~/hooks/utiliser-envoi-avis";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserLimitationCompte } from "~/hooks/utiliser-limitation-compte";
import type { EtatPhotoAvis } from "~/hooks/utiliser-photo-avis";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  visite: Visite;
  envoi: EtatEnvoiAvis;
  photo: EtatPhotoAvis;
  onRetour: () => void;
};

const MENTIONS_REGLEMENT = {
  offert: { emoji: "🎁", texte: TEXTES_DONNER_AVIS.repasOffert },
  reduction: { emoji: "🏷️", texte: TEXTES_DONNER_AVIS.avecReduction },
} as const;

function choisirLibelleBouton(enCours: EtatEnvoiAvis["enCours"]): string {
  if (enCours === "photo") return TEXTES_DONNER_AVIS.envoiPhoto;
  if (enCours === "avis") return TEXTES_DONNER_AVIS.envoiAvis;
  return TEXTES_DONNER_AVIS.publier;
}

export function EcranFormulaireAvis({ visite, envoi, photo, onRetour }: Props) {
  const { profil } = utiliserProfil();
  const { lieu } = utiliserLieuParId(visite.lieu.id);
  const { limitation } = utiliserLimitationCompte();
  const [note, setNote] = useState<NoteAvis | null>(null);
  const [texte, setTexte] = useState("");
  const { refus, enCours } = envoi;

  const repasOffert = visite.reglement?.type === "offert";
  const typeReglement = visite.reglement?.type;
  const mentionReglement = typeReglement === "offert" || typeReglement === "reduction" ? MENTIONS_REGLEMENT[typeReglement] : null;
  const lieuAlcool = lieu ? lieuEvoqueAlcool(lieu) : visite.lieu.type === "bar";
  const limite = limitation?.active === true || refus?.ou === "limite";
  const complet = note !== null && texte.trim().length >= TEXTE_AVIS_MIN;
  const signature = profil ? signerAvis(profil.prenom, profil.nom?.trim().charAt(0) || null) : null;
  const erreurPhoto = photo.erreur ?? (refus?.ou === "photo" ? decrireRefusPhotoAvis(refus.erreur) : null);

  function oublierRefusSaisie() {
    if (refus && refus.ou !== "limite") envoi.oublierRefus();
  }

  function publier() {
    if (note !== null) void envoi.envoyer({ visiteId: visite.id, note, texte, photo: photo.photo });
  }

  return (
    <EcranReglage
      titre={TEXTES_DONNER_AVIS.titre}
      sousTitre={TEXTES_DONNER_AVIS.sousTitre}
      onRetour={onRetour}
      boutonPrincipal={{
        libelle: choisirLibelleBouton(enCours),
        onPress: publier,
        desactive: !complet || limite || enCours !== null || photo.preparation,
        indice: complet ? undefined : remplirModele(TEXTES_DONNER_AVIS.publierIndiceIncomplet, { min: String(TEXTE_AVIS_MIN) }),
      }}
      auDessusDuBouton={
        limite ? (
          <RefusLimitationEnPlace texte={REFUS_LIMITATION.avis} />
        ) : refus?.ou === "envoi" ? (
          <EncadreRefusEnvoiAvis erreur={refus.erreur} details={refus.details} />
        ) : null
      }
    >
      <View className="gap-7">
        {visite.demo ? <EncadreAvis emoji="🧪" texte={TEXTES_DONNER_AVIS.demo} /> : null}
        <View className="gap-3">
          <CarteVisiteAvis visite={visite} />
          {lieuAlcool ? <MentionPrevention /> : null}
          {mentionReglement ? <EncadreAvis emoji={mentionReglement.emoji} texte={mentionReglement.texte} /> : null}
        </View>
        <FormulaireAvis
          note={note}
          texte={texte}
          photo={photo.photo}
          pointsPhoto={calculerPointsPhotoAvis({ verifie: true, avecPhoto: true, repasOffert })}
          repasOffert={repasOffert}
          preparationPhoto={photo.preparation}
          erreurTexte={refus?.ou === "texte" ? TEXTES_DONNER_AVIS.texteRetouche : null}
          erreurPhoto={erreurPhoto}
          mentionAlcool={!lieuAlcool && parleDAlcool(texte)}
          desactive={enCours !== null}
          onChoisirNote={(nouvelle) => {
            setNote(nouvelle);
            oublierRefusSaisie();
          }}
          onChangerTexte={(nouveau) => {
            setTexte(nouveau);
            oublierRefusSaisie();
          }}
          onAjouterPhoto={() => {
            oublierRefusSaisie();
            void photo.choisir();
          }}
          onRetirerPhoto={() => {
            oublierRefusSaisie();
            photo.retirer();
          }}
        />
        {signature ? (
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(remplirModele(TEXTES_DONNER_AVIS.signature, { signature }))}</Text>
        ) : null}
      </View>
    </EcranReglage>
  );
}
