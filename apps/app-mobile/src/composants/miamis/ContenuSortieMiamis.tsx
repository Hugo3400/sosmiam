import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { compterPlacesLibres } from "@sos-miam/commun/fonctions/sorties-miamis/compter-places-libres";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { ActionsSortieMiamis } from "~/composants/miamis/ActionsSortieMiamis";
import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { CarteLieuSortieMiamis } from "~/composants/miamis/CarteLieuSortieMiamis";
import { DemandesArriveeMiamis } from "~/composants/miamis/DemandesArriveeMiamis";
import { EnTeteSortieMiamis } from "~/composants/miamis/EnTeteSortieMiamis";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { FeuilleSignalerSortieMiamis } from "~/composants/miamis/FeuilleSignalerSortieMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { LienDiscretMiamis } from "~/composants/miamis/LienDiscretMiamis";
import { ListeAttenteSortieMiamis } from "~/composants/miamis/ListeAttenteSortieMiamis";
import { OrganisationSortieMiamis } from "~/composants/miamis/OrganisationSortieMiamis";
import { QuiVientSortieMiamis } from "~/composants/miamis/QuiVientSortieMiamis";
import { ReglesSortieMiamis } from "~/composants/miamis/ReglesSortieMiamis";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { REFUS_LIMITATION_MIAMIS_PAR_LANGUE, TEXTES_ACCES_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { estNouveauDansLApp } from "~/fonctions/miamis/est-nouveau-dans-l-app";
import { estPresenceOuverte } from "~/fonctions/miamis/est-presence-ouverte";
import { lireOccupationSortie } from "~/fonctions/miamis/lire-occupation-sortie";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSortieMiamis } from "~/hooks/utiliser-sortie-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  id: string;
};

type Confirmation = "quitter" | "annuler" | "scanner" | null;

export function ContenuSortieMiamis({ id }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_MIAMIS_PAR_LANGUE);
  const TA = utiliserTextes(TEXTES_ACCES_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const monId = utiliserMonId();
  const { compte } = utiliserSession();
  const s = utiliserSortieMiamis(id);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [refusLimite, setRefusLimite] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [signalement, setSignalement] = useState(false);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const revenir = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/potes", params: { espace: "miamis" } }));

  async function faire(geste: () => Promise<ErreurService | null>, refusCompteLimite: string | null, succes: string | null) {
    setRefusLimite(null);
    const erreur = await geste();
    if (!erreur) {
      if (succes) annoncer(succes);
      return true;
    }
    if (erreur === "compte-limite" && refusCompteLimite) setRefusLimite(refusCompteLimite);
    else if (erreur === "presence-non-validee") setConfirmation("scanner");
    else annoncer(messagesService[erreur].texte);
    return false;
  }

  const sortie = s.sortie;
  if (!sortie) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
        <BarreEcranMiamis titre={T.barre} />
        <View className="px-5 pt-6">
          {s.erreur === "sortie-inconnue" ? (
            <EtatMiamis emoji="🫥" titre={T.introuvableTitre} texte={T.introuvableTexte} action={{ libelle: TA.retour, onPress: revenir }} />
          ) : s.erreur ? (
            <ErreurMiamis erreur={s.erreur} onReessayer={() => void s.relire()} />
          ) : (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel={TE.chargementSortie} />
          )}
        </View>
      </View>
    );
  }

  const organisateur = sortie.moi.place === "organisateur";
  const complet = compterPlacesLibres(lireOccupationSortie(sortie), estNouveauDansLApp(compte?.creeLe)) === 0;
  const succesDemande = sortie.invitationHabitue ? T.reentree : T.demandePartie(sortie.organisateur.pseudo);

  return (
    <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
      <BarreEcranMiamis titre={T.barre} />
      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <EnTeteSortieMiamis sortie={sortie} />
        <CarteLieuSortieMiamis lieu={sortie.lieu} />
        <OrganisationSortieMiamis sortie={sortie} />
        {organisateur ? (
          <DemandesArriveeMiamis
            demandes={sortie.demandes}
            enCours={s.enCours}
            onAccepter={(personne) => void faire(() => s.accepter(personne), null, T.arriveeAcceptee)}
            onRefuser={(personne) => void faire(() => s.refuser(personne), null, null)}
          />
        ) : null}
        <QuiVientSortieMiamis sortie={sortie} monId={monId} onRetirer={(personne) => void faire(() => s.retirer(personne), null, null)} />
        {organisateur ? <ListeAttenteSortieMiamis personnes={sortie.listeAttente} onRetirer={(personne) => void faire(() => s.retirer(personne), null, null)} /> : null}
        <ReglesSortieMiamis />
        {organisateur ? <LienDiscretMiamis libelle={T.annulerSortie} danger onPress={() => setConfirmation("annuler")} indice={TE.apresConfirmation} /> : null}
        {organisateur ? null : <LienDiscretMiamis libelle={T.signalerSortie} onPress={() => setSignalement(true)} indice={T.signalerSortieIndice} />}
      </ScrollView>

      <View style={{ paddingBottom: marges.bottom + 12 }} className="gap-3 border-t border-ligne bg-creme px-5 pt-3">
        <RefusLimitationEnPlace texte={refusLimite} />
        <ActionsSortieMiamis
          sortie={sortie}
          complet={complet}
          enCours={s.enCours}
          presenceOuverte={estPresenceOuverte(sortie.quand)}
          onDemander={() => void faire(s.demanderAVenir, refusLimitation.venir, succesDemande)}
          onAnnulerDemande={() => void faire(s.annulerDemande, null, null)}
          onQuitter={() => (sortie.moi.place === "attente" ? void faire(s.quitter, null, null) : setConfirmation("quitter"))}
          onDiscussion={() => sortie.conversationId && router.push({ pathname: "/potes/discussion/[id]", params: { id: sortie.conversationId } })}
          onPresence={() => void faire(s.validerPresence, null, T.presenceValidee)}
        />
      </View>

      <FeuilleConfirmation
        visible={confirmation === "quitter"}
        emoji="🪑"
        titre={T.departTitre}
        detail={T.departDetail}
        libelleConfirmer={T.departConfirmer}
        libelleRester={T.departRester}
        onConfirmer={() => void faire(s.quitter, null, T.departFait)}
        onFermer={() => setConfirmation(null)}
      />
      <FeuilleConfirmation
        visible={confirmation === "annuler"}
        emoji="🗑️"
        titre={T.annulationTitre(sortie.titre)}
        detail={T.annulationDetail}
        libelleConfirmer={T.annulerSortie}
        libelleRester={T.annulationGarder}
        onConfirmer={() => void s.annuler().then((erreur) => (erreur ? annoncer(messagesService[erreur].texte) : revenir()))}
        onFermer={() => setConfirmation(null)}
      />
      <FeuilleConfirmation
        visible={confirmation === "scanner"}
        emoji="📷"
        titre={T.scannerTitre}
        detail={T.scannerDetail}
        libelleConfirmer={T.scannerBouton}
        libelleRester={T.scannerPlusTard}
        onConfirmer={() => router.push("/scan/camera")}
        onFermer={() => setConfirmation(null)}
      />
      <FeuilleSignalerSortieMiamis sortieId={signalement ? sortie.id : null} titre={sortie.titre} onFermer={() => setSignalement(false)} />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
