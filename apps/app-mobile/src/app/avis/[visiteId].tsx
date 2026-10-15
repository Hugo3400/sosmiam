import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTE_AVIS_MIN } from "@sos-miam/commun/regles/avis";
import { CadreAvis } from "~/composants/avis/CadreAvis";
import { CarteVisiteAvis } from "~/composants/avis/CarteVisiteAvis";
import { EncadreAvis } from "~/composants/avis/EncadreAvis";
import { FormulaireAvis } from "~/composants/avis/FormulaireAvis";
import { MerciAvis } from "~/composants/avis/MerciAvis";
import { SelecteurExempleTemporaireAvis } from "~/composants/avis/SelecteurExempleTemporaireAvis";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Bouton } from "~/composants/interface/Bouton";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { MessageEchecVisite } from "~/composants/visites/MessageEchecVisite";
import {
  EXEMPLES_TEMPORAIRES_DONNER_AVIS,
  construireAvisPublicExemple,
  lireCasExempleDonnerAvis,
  type CasExempleDonnerAvis,
  type ExempleTemporaireDonnerAvis,
  type SaisieAvisExemple,
} from "~/contenus/donner-avis-exemples-temporaires";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";

type RefusEnvoi = ExempleTemporaireDonnerAvis["refusEnvoi"];

const DELAI_FOCUS_MS = 450;
const MESSAGE_RETOUCHE = `${MESSAGES_SERVICE["avis-invalide"].titre}. ${MESSAGES_SERVICE["avis-invalide"].texte}`;

function decrireMentionReglement(exemple: ExempleTemporaireDonnerAvis): { emoji: string; texte: string } | null {
  const type = exemple.visite.reglement?.type;
  if (type === "offert") return { emoji: "🎁", texte: TEXTES_DONNER_AVIS.repasOffert };
  if (type === "reduction") return { emoji: "🏷️", texte: TEXTES_DONNER_AVIS.avecReduction };
  return null;
}

export default function EcranDonnerAvis() {
  const router = useRouter();
  const { apercu } = useLocalSearchParams<{ visiteId: string; apercu?: string }>();
  const [cas, setCas] = useState<CasExempleDonnerAvis>(() => lireCasExempleDonnerAvis(apercu));
  const exemple = EXEMPLES_TEMPORAIRES_DONNER_AVIS[cas];
  const [saisie, setSaisie] = useState<SaisieAvisExemple>(exemple.saisieDeDepart);
  const [refusEnvoi, setRefusEnvoi] = useState<RefusEnvoi>(null);
  const [merci, setMerci] = useState(false);
  const refTitre = useRef<Text>(null);

  const { visite } = exemple;
  const repasOffert = visite.reglement?.type === "offert";
  const mentionReglement = decrireMentionReglement(exemple);
  const complet = saisie.note !== null && saisie.texte.trim().length >= TEXTE_AVIS_MIN;

  useEffect(() => {
    if (!merci && !exemple.refusOuverture) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_MS);
    return () => clearTimeout(minuterie);
  }, [merci, exemple.refusOuverture]);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/visites"));

  function choisirCas(nouveau: CasExempleDonnerAvis) {
    setCas(nouveau);
    setSaisie(EXEMPLES_TEMPORAIRES_DONNER_AVIS[nouveau].saisieDeDepart);
    setRefusEnvoi(null);
    setMerci(false);
  }

  function modifier(changement: Partial<SaisieAvisExemple>) {
    setSaisie((avant) => ({ ...avant, ...changement }));
    setRefusEnvoi(null);
  }

  function publier() {
    if (exemple.refusEnvoi) return setRefusEnvoi(exemple.refusEnvoi);
    setMerci(true);
  }

  if (exemple.refusOuverture) {
    const texte = exemple.refusOuverture === "avis-pas-ouvert" ? (decrireOuvertureAvis(visite.avis) ?? undefined) : undefined;
    return (
      <CadreAvis onRetour={revenir} centre>
        <MessageEchecVisite
          erreur={exemple.refusOuverture}
          lieuNom={visite.lieu.nom}
          texte={texte}
          refTitre={refTitre}
          actions={[{ libelle: TEXTES_DONNER_AVIS.retourVisite, onPress: revenir }]}
        />
        <SelecteurExempleTemporaireAvis cas={cas} onChoisir={choisirCas} />
      </CadreAvis>
    );
  }

  if (merci && saisie.note !== null) {
    const avis = construireAvisPublicExemple(exemple, saisie.note, saisie);
    const pied = (
      <>
        <Bouton libelle={TEXTES_DONNER_AVIS.merciTermine} onPress={revenir} />
        <Bouton libelle={TEXTES_DONNER_AVIS.merciMesVisites} variante="blanc" onPress={() => router.navigate("/visites")} />
      </>
    );
    return (
      <CadreAvis onRetour={revenir} pied={pied}>
        <MerciAvis
          prenom={exemple.prenom}
          nomLieu={visite.lieu.nom}
          avis={avis}
          sourcePhoto={saisie.photo}
          pointsGagnes={saisie.photo ? exemple.pointsPhoto : 0}
          alcool={visite.lieu.type === "bar" || parleDAlcool(avis.texte)}
          refTitre={refTitre}
        />
      </CadreAvis>
    );
  }

  return (
    <EcranReglage
      titre={TEXTES_DONNER_AVIS.titre}
      sousTitre={TEXTES_DONNER_AVIS.sousTitre}
      boutonPrincipal={{
        libelle: TEXTES_DONNER_AVIS.publier,
        onPress: publier,
        desactive: !complet,
        indice: complet ? undefined : TEXTES_DONNER_AVIS.publierIndiceIncomplet,
      }}
      auDessusDuBouton={<RefusLimitationEnPlace texte={refusEnvoi === "compte-limite" ? REFUS_LIMITATION.avis : null} />}
    >
      <View className="gap-7">
        <View className="gap-3">
          <CarteVisiteAvis visite={visite} />
          {visite.lieu.type === "bar" ? <MentionPrevention /> : null}
          {mentionReglement ? <EncadreAvis emoji={mentionReglement.emoji} texte={mentionReglement.texte} /> : null}
        </View>
        <FormulaireAvis
          note={saisie.note}
          texte={saisie.texte}
          photo={saisie.photo}
          pointsPhoto={exemple.pointsPhoto}
          repasOffert={repasOffert}
          erreurTexte={refusEnvoi === "avis-invalide" ? MESSAGE_RETOUCHE : null}
          onChoisirNote={(note) => modifier({ note })}
          onChangerTexte={(texte) => modifier({ texte })}
          onAjouterPhoto={() => modifier({ photo: exemple.photoAjoutee })}
          onRetirerPhoto={() => modifier({ photo: null })}
        />
        <Text className="font-texte text-[13px] leading-[18px] text-gris">
          {lierPonctuation(remplirModele(TEXTES_DONNER_AVIS.signature, { signature: exemple.signature }))}
        </Text>
        <SelecteurExempleTemporaireAvis cas={cas} onChoisir={choisirCas} />
      </View>
    </EcranReglage>
  );
}
