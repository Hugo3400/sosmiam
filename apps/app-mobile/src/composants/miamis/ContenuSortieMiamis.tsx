import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
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
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { LienDiscretMiamis } from "~/composants/miamis/LienDiscretMiamis";
import { ListeAttenteSortieMiamis } from "~/composants/miamis/ListeAttenteSortieMiamis";
import { OrganisationSortieMiamis } from "~/composants/miamis/OrganisationSortieMiamis";
import { QuiVientSortieMiamis } from "~/composants/miamis/QuiVientSortieMiamis";
import { ReglesSortieMiamis } from "~/composants/miamis/ReglesSortieMiamis";
import { REFUS_LIMITATION_MIAMIS, TEXTES_ACCES_MIAMIS } from "~/contenus/textes-miamis";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { estNouveauDansLApp } from "~/fonctions/miamis/est-nouveau-dans-l-app";
import { estPresenceOuverte } from "~/fonctions/miamis/est-presence-ouverte";
import { lireOccupationSortie } from "~/fonctions/miamis/lire-occupation-sortie";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSortieMiamis } from "~/hooks/utiliser-sortie-miamis";
import couleurs from "~/theme/couleurs";

type Props = {
  id: string;
};

type Confirmation = "quitter" | "annuler" | "scanner" | null;

export function ContenuSortieMiamis({ id }: Props) {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const monId = utiliserMonId();
  const { compte } = utiliserSession();
  const s = utiliserSortieMiamis(id);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [refusLimite, setRefusLimite] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
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
    else annoncer(MESSAGES_SERVICE[erreur].texte);
    return false;
  }

  const sortie = s.sortie;
  if (!sortie) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
        <BarreEcranMiamis titre={TEXTES_SORTIE_MIAMIS.barre} />
        <View className="px-5 pt-6">
          {s.erreur === "sortie-inconnue" ? (
            <EtatMiamis emoji="🫥" titre={TEXTES_SORTIE_MIAMIS.introuvableTitre} texte={TEXTES_SORTIE_MIAMIS.introuvableTexte} action={{ libelle: TEXTES_ACCES_MIAMIS.retour, onPress: revenir }} />
          ) : s.erreur ? (
            <ErreurMiamis erreur={s.erreur} onReessayer={() => void s.relire()} />
          ) : (
            <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement de la sortie" />
          )}
        </View>
      </View>
    );
  }

  const organisateur = sortie.moi.place === "organisateur";
  const complet = compterPlacesLibres(lireOccupationSortie(sortie), estNouveauDansLApp(compte?.creeLe)) === 0;
  const succesDemande = sortie.invitationHabitue ? TEXTES_SORTIE_MIAMIS.reentree : TEXTES_SORTIE_MIAMIS.demandePartie(sortie.organisateur.pseudo);

  return (
    <View style={{ flex: 1, paddingTop: marges.top }} className="bg-creme">
      <BarreEcranMiamis titre={TEXTES_SORTIE_MIAMIS.barre} />
      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <EnTeteSortieMiamis sortie={sortie} />
        <CarteLieuSortieMiamis lieu={sortie.lieu} />
        <OrganisationSortieMiamis sortie={sortie} />
        {organisateur ? (
          <DemandesArriveeMiamis
            demandes={sortie.demandes}
            enCours={s.enCours}
            onAccepter={(personne) => void faire(() => s.accepter(personne), null, TEXTES_SORTIE_MIAMIS.arriveeAcceptee)}
            onRefuser={(personne) => void faire(() => s.refuser(personne), null, null)}
          />
        ) : null}
        <QuiVientSortieMiamis sortie={sortie} monId={monId} onRetirer={(personne) => void faire(() => s.retirer(personne), null, null)} />
        {organisateur ? <ListeAttenteSortieMiamis personnes={sortie.listeAttente} onRetirer={(personne) => void faire(() => s.retirer(personne), null, null)} /> : null}
        <ReglesSortieMiamis />
        {organisateur ? <LienDiscretMiamis libelle={TEXTES_SORTIE_MIAMIS.annulerSortie} danger onPress={() => setConfirmation("annuler")} indice="Après confirmation" /> : null}
      </ScrollView>

      <View style={{ paddingBottom: marges.bottom + 12 }} className="gap-3 border-t border-ligne bg-creme px-5 pt-3">
        <RefusLimitationEnPlace texte={refusLimite} />
        <ActionsSortieMiamis
          sortie={sortie}
          complet={complet}
          enCours={s.enCours}
          presenceOuverte={estPresenceOuverte(sortie.quand)}
          onDemander={() => void faire(s.demanderAVenir, REFUS_LIMITATION_MIAMIS.venir, succesDemande)}
          onAnnulerDemande={() => void faire(s.annulerDemande, null, null)}
          onQuitter={() => (sortie.moi.place === "attente" ? void faire(s.quitter, null, null) : setConfirmation("quitter"))}
          onDiscussion={() => sortie.conversationId && router.push({ pathname: "/potes/discussion/[id]", params: { id: sortie.conversationId } })}
          onPresence={() => void faire(s.validerPresence, null, TEXTES_SORTIE_MIAMIS.presenceValidee)}
        />
      </View>

      <FeuilleConfirmation
        visible={confirmation === "quitter"}
        emoji="🪑"
        titre={TEXTES_SORTIE_MIAMIS.departTitre}
        detail={TEXTES_SORTIE_MIAMIS.departDetail}
        libelleConfirmer={TEXTES_SORTIE_MIAMIS.departConfirmer}
        libelleRester={TEXTES_SORTIE_MIAMIS.departRester}
        onConfirmer={() => void faire(s.quitter, null, TEXTES_SORTIE_MIAMIS.departFait)}
        onFermer={() => setConfirmation(null)}
      />
      <FeuilleConfirmation
        visible={confirmation === "annuler"}
        emoji="🗑️"
        titre={TEXTES_SORTIE_MIAMIS.annulationTitre(sortie.titre)}
        detail={TEXTES_SORTIE_MIAMIS.annulationDetail}
        libelleConfirmer={TEXTES_SORTIE_MIAMIS.annulerSortie}
        libelleRester={TEXTES_SORTIE_MIAMIS.annulationGarder}
        onConfirmer={() => void s.annuler().then((erreur) => (erreur ? annoncer(MESSAGES_SERVICE[erreur].texte) : revenir()))}
        onFermer={() => setConfirmation(null)}
      />
      <FeuilleConfirmation
        visible={confirmation === "scanner"}
        emoji="📷"
        titre={TEXTES_SORTIE_MIAMIS.scannerTitre}
        detail={TEXTES_SORTIE_MIAMIS.scannerDetail}
        libelleConfirmer={TEXTES_SORTIE_MIAMIS.scannerBouton}
        libelleRester={TEXTES_SORTIE_MIAMIS.scannerPlusTard}
        onConfirmer={() => router.push("/scan/camera")}
        onFermer={() => setConfirmation(null)}
      />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </View>
  );
}
