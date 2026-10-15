import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { CarteAvisPro } from "~/composants/pro/CarteAvisPro";
import { FeuilleReponseAvis } from "~/composants/pro/FeuilleReponseAvis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_AVIS_LIEU } from "~/contenus/textes-avis-lieu";
import { TEXTES_AVIS_PRO } from "~/contenus/textes-avis-pro";
import { ecrireResumeAvis } from "~/fonctions/avis/ecrire-resume-avis";
import { enchainerPhrases } from "~/fonctions/texte/enchainer-phrases";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserAvisPro } from "~/hooks/utiliser-avis-pro";
import { utiliserLimitationCompte } from "~/hooks/utiliser-limitation-compte";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserSourcePhotoAvis } from "~/hooks/utiliser-source-photo-avis";
import couleurs from "~/theme/couleurs";

const T = TEXTES_AVIS_PRO;

export default function EcranAvisPro() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { lieuPro } = utiliserModes();
  const { limitation } = utiliserLimitationCompte();
  const avisPro = utiliserAvisPro(lieuPro?.id ?? null);
  const lireSourcePhoto = utiliserSourcePhotoAvis();
  const [cible, setCible] = useState<AvisPublic | null>(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [motRefuse, setMotRefuse] = useState(false);
  const [limiteVue, setLimiteVue] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const numeroAnnonce = useRef(0);
  const gerant = lieuPro?.role === "gerant";
  const limite = limitation?.active === true || limiteVue;

  const annoncer = (texte: string) => {
    numeroAnnonce.current += 1;
    setAnnonce({ texte, numero: numeroAnnonce.current });
  };
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/pro/mon-lieu"));

  function ouvrir(avis: AvisPublic) {
    setCible(avis);
    setMotRefuse(false);
    setFeuilleOuverte(true);
  }

  async function publier(texte: string) {
    if (!cible) return;
    const r = await avisPro.repondre(cible.id, texte);
    if (r.ok) {
      setFeuilleOuverte(false);
      annoncer(remplirModele(T.annoncePubliee, { signature: cible.signature }));
      return;
    }
    if (r.erreur === "message-refuse") return setMotRefuse(true);
    setFeuilleOuverte(false);
    if (r.erreur === "compte-limite") return setLimiteVue(true);
    const message = decrireEchecVisite(r.erreur, r.details, lieuPro?.nom);
    annoncer(enchainerPhrases([message.titre, message.texte]));
  }

  const dessiner = (avis: AvisPublic) => (
    <CarteAvisPro
      key={avis.id}
      avis={avis}
      sourcePhoto={lireSourcePhoto(avis.photo)}
      nomLieu={lieuPro?.nom ?? ""}
      gerant={gerant}
      desactive={limite || avisPro.enCours !== null}
      onRepondre={() => ouvrir(avis)}
    />
  );

  const contenu = () => {
    const { lecture } = avisPro;
    if (!lieuPro) return <CarteMessageReservations emoji="🧑‍🍳" titre={T.sansLieuTitre} texte={T.sansLieuTexte} />;
    if (lecture.etat === "attente") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      );
    }
    if (lecture.etat === "erreur") {
      const message = decrireEchecVisite(lecture.erreur, undefined, lieuPro.nom);
      const action = { libelle: T.reessayer, indice: T.indiceReessayer, onPress: () => void avisPro.relire() };
      return <CarteMessageReservations emoji={MESSAGES_SERVICE[lecture.erreur].emoji} titre={message.titre} texte={message.texte} action={action} />;
    }
    const resume = ecrireResumeAvis(lecture.resume);
    if (!resume || lecture.avis.length === 0) return <CarteMessageReservations emoji="⭐" titre={T.videTitre} texte={T.videTexte} />;
    const sansReponse = lecture.avis.filter((a) => a.reponseLieu === null);
    const avecReponse = lecture.avis.filter((a) => a.reponseLieu !== null);
    return (
      <>
        <View accessible accessibilityLabel={resume.lu} className="gap-1">
          <Text className="font-texte-gras text-base text-encre">{`★ ${resume.visible}`}</Text>
          <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(TEXTES_AVIS_LIEU.prudence)}</Text>
        </View>
        {limite && gerant ? <RefusLimitationEnPlace texte={REFUS_LIMITATION.reponseAvis} /> : null}
        {sansReponse.length > 0 ? (
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">{`${T.aRepondre} · ${sansReponse.length}`}</Text>
            {sansReponse.map(dessiner)}
          </View>
        ) : null}
        {avecReponse.length > 0 ? (
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">{`${T.dejaRepondu} · ${avecReponse.length}`}</Text>
            {avecReponse.map(dessiner)}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre={T.titre} sousTitre={lieuPro ? `${lieuPro.emoji} ${lieuPro.nom} · ${T.sousTitre}` : undefined} onRetour={revenir}>
        <View className="gap-6">{contenu()}</View>
        <FeuilleReponseAvis
          key={cible?.id ?? 0}
          visible={feuilleOuverte}
          signature={cible?.signature ?? ""}
          enCours={cible !== null && avisPro.enCours === cible.id}
          motRefuse={motRefuse}
          onPublier={(texte) => void publier(texte)}
          onChanger={() => setMotRefuse(false)}
          onFermer={() => setFeuilleOuverte(false)}
        />
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </View>
  );
}
