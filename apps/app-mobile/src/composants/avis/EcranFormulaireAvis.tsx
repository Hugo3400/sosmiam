import { useEffect, useRef, useState } from "react";
import { Text, View, type TextInput } from "react-native";

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
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { decrireRefusEnvoiAvis } from "~/fonctions/avis/decrire-refus-envoi-avis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { EtatEnvoiAvis } from "~/hooks/utiliser-envoi-avis";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserLimitationCompte } from "~/hooks/utiliser-limitation-compte";
import type { EtatPhotoAvis } from "~/hooks/utiliser-photo-avis";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visite: Visite;
  envoi: EtatEnvoiAvis;
  photo: EtatPhotoAvis;
  onRetour: () => void;
};

type Textes = typeof TEXTES_DONNER_AVIS_PAR_LANGUE.fr;

const EMOJIS_REGLEMENT = { offert: "🎁", reduction: "🏷️" } as const;

function choisirLibelleBouton(enCours: EtatEnvoiAvis["enCours"], T: Textes): string {
  if (enCours === "photo") return T.envoiPhoto;
  if (enCours === "avis") return T.envoiAvis;
  return T.publier;
}

export function EcranFormulaireAvis({ visite, envoi, photo, onRetour }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { profil } = utiliserProfil();
  const { lieu } = utiliserLieuParId(visite.lieu.id);
  const { limitation } = utiliserLimitationCompte();
  const [note, setNote] = useState<NoteAvis | null>(null);
  const [texte, setTexte] = useState("");
  const refTexte = useRef<TextInput>(null);
  const { refus, enCours } = envoi;
  const motRefuse = refus?.ou === "texte";

  const repasOffert = visite.reglement?.type === "offert";
  const typeReglement = visite.reglement?.type;
  const mentionReglement =
    typeReglement === "offert" || typeReglement === "reduction"
      ? { emoji: EMOJIS_REGLEMENT[typeReglement], texte: typeReglement === "offert" ? T.repasOffert : T.avecReduction }
      : null;
  const lieuAlcool = lieu ? lieuEvoqueAlcool(lieu) : visite.lieu.type === "bar";
  const limite = limitation?.active === true || refus?.ou === "limite";
  const complet = note !== null && texte.trim().length >= TEXTE_AVIS_MIN;
  const signature = profil ? signerAvis(profil.prenom, profil.nom?.trim().charAt(0) || null) : null;
  const message = decrireRefusEnvoiAvis(refus, langue);

  useEffect(() => {
    if (motRefuse) refTexte.current?.focus();
  }, [motRefuse]);

  function oublierRefusSaisie() {
    if (refus && refus.ou !== "limite") envoi.oublierRefus();
  }

  function publier() {
    if (note !== null) void envoi.envoyer({ visiteId: visite.id, note, texte, photo: photo.photo });
  }

  return (
    <EcranReglage
      titre={T.titre}
      sousTitre={T.sousTitre}
      onRetour={onRetour}
      boutonPrincipal={{
        libelle: choisirLibelleBouton(enCours, T),
        onPress: publier,
        desactive: !complet || limite || enCours !== null || photo.preparation,
        indice: complet ? undefined : remplirModele(T.publierIndiceIncomplet, { min: String(TEXTE_AVIS_MIN) }),
      }}
      auDessusDuBouton={
        limite ? (
          <RefusLimitationEnPlace texte={refusLimitation.avis} />
        ) : message ? (
          <EncadreRefusEnvoiAvis emoji={message.emoji} titre={message.titre} texte={message.texte} />
        ) : null
      }
    >
      <View className="gap-7">
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
          refTexte={refTexte}
          erreurTexte={motRefuse ? T.texteRetouche : null}
          erreurPhoto={photo.erreur}
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
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(remplirModele(T.signature, { signature }))}</Text>
        ) : null}
      </View>
    </EcranReglage>
  );
}
