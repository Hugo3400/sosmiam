import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { RESERVATIONS_A_VENIR_MAX } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { CarteReservation } from "~/composants/reservations/CarteReservation";
import { EtatVideReservations } from "~/composants/reservations/EtatVideReservations";
import { SectionReservations } from "~/composants/reservations/SectionReservations";
import { FeuilleEchecVisite } from "~/composants/visites/FeuilleEchecVisite";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { SANS_COMPTE_RESERVATIONS, TEXTES_ECHEC_GESTE_RESERVATION, TEXTES_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { compterReservationsEnCours } from "~/fonctions/reservations/compter-reservations-en-cours";
import { decrireAnnulationReservation, type TextesAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { rangerReservations } from "~/fonctions/reservations/ranger-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserClientReservation } from "~/hooks/utiliser-client-reservation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserGestesReservation } from "~/hooks/utiliser-gestes-reservation";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserMesReservations } from "~/hooks/utiliser-mes-reservations";
import { utiliserServices } from "~/hooks/utiliser-services";

type AnnulationDemandee = { reservation: Reservation; textes: TextesAnnulationReservation };

export default function EcranMesReservations() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const { source } = utiliserServices();
  const demanderCompte = utiliserDemandeCompte();
  const client = utiliserClientReservation();
  const { maintenantMs, recaler } = utiliserHorlogeMinute();
  const { lecture, actualiser, remplacer } = utiliserMesReservations();
  const gestes = utiliserGestesReservation({
    remplacer: (reservation) => {
      recaler();
      remplacer(reservation);
    },
    actualiser,
  });
  const [annulation, setAnnulation] = useState<AnnulationDemandee | null>(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const resultatAnnulation = useRef<Promise<boolean> | null>(null);

  function demanderAnnulation(reservation: Reservation) {
    const instant = Date.now();
    const { annulationTardive } = calculerGestesReservation(reservation, instant);
    setAnnulation({ reservation, textes: decrireAnnulationReservation(reservation, annulationTardive, instant) });
    setFeuilleOuverte(true);
  }

  const dessinerCarte = (reservation: Reservation) => (
    <CarteReservation
      key={reservation.id}
      reservation={reservation}
      maintenantMs={maintenantMs}
      client={client}
      presenceEnCours={gestes.presence?.reservationId === reservation.id ? gestes.presence.texte : null}
      onAnnuler={demanderAnnulation}
      onSignalerPresence={(r) => void gestes.signalerPresence(r)}
      onOuvrirLieu={(lieuId) => router.push({ pathname: "/lieu/[id]", params: { id: String(lieuId) } })}
    />
  );

  const contenu = () => {
    if (source === "indisponible") {
      const { emoji, titre, texte, bouton, indice } = SANS_COMPTE_RESERVATIONS;
      return <CarteMessageReservations emoji={emoji} titre={titre} texte={texte} action={{ libelle: bouton, indice, onPress: () => demanderCompte("reserver") }} />;
    }
    if (lecture.etat === "attente") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={TEXTES_MES_RESERVATIONS.chargement} />
        </View>
      );
    }
    if (lecture.etat === "erreur") {
      const message = MESSAGES_SERVICE[lecture.erreur];
      const action = { libelle: TEXTES_MES_RESERVATIONS.reessayer, indice: TEXTES_MES_RESERVATIONS.indiceReessayer, onPress: () => void actualiser() };
      return <CarteMessageReservations emoji={message.emoji} titre={message.titre} texte={lecture.erreur === "hors-ligne" ? TEXTES_MES_RESERVATIONS.lectureHorsLigne : message.texte} action={action} />;
    }
    if (lecture.reservations.length === 0) return <EtatVideReservations onExplorer={() => router.navigate("/explorer")} />;
    const { aVenir, passees } = rangerReservations(lecture.reservations, maintenantMs);
    return (
      <>
        {aVenir.length > 0 ? (
          <SectionReservations titre="À venir" nombre={aVenir.length}>
            {compterReservationsEnCours(aVenir, maintenantMs) >= RESERVATIONS_A_VENIR_MAX ? (
              <Text className="rounded-2xl bg-jaune-clair px-3.5 py-2.5 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(TEXTES_MES_RESERVATIONS.noteMaximum)}</Text>
            ) : null}
            {aVenir.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
        {passees.length > 0 ? (
          <SectionReservations titre="Passées" nombre={passees.length}>
            {passees.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
      </>
    );
  };

  return (
    <EcranReglage titre={TEXTES_MES_RESERVATIONS.titre} sousTitre={TEXTES_MES_RESERVATIONS.sousTitre} onRetour={fermer}>
      <View className="gap-6">{contenu()}</View>

      <FeuilleConfirmation
        visible={feuilleOuverte}
        emoji="🗓️"
        titre={annulation?.textes.titre ?? ""}
        detail={annulation?.textes.detail ?? ""}
        libelleConfirmer={annulation?.textes.libelleConfirmer ?? ""}
        libelleRester={annulation?.textes.libelleRester ?? ""}
        onConfirmer={() => {
          resultatAnnulation.current = annulation ? gestes.annuler(annulation.reservation) : null;
        }}
        onRefermee={() => {
          const annonce = annulation?.textes.annonce;
          void resultatAnnulation.current?.then((ok) => {
            if (ok && annonce) AccessibilityInfo.announceForAccessibility(annonce);
          });
        }}
        onFermer={() => setFeuilleOuverte(false)}
      />
      <FeuillePositionVisite {...gestes.propsFeuillePosition} />
      <FeuilleEchecVisite
        echec={gestes.echec}
        lieuNom={gestes.echec?.reservation.lieu.nom}
        textes={TEXTES_ECHEC_GESTE_RESERVATION}
        actions={gestes.actionsEchec}
        onFermer={gestes.fermerEchec}
      />
    </EcranReglage>
  );
}
