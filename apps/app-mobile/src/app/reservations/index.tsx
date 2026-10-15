import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { RESERVATIONS_A_VENIR_MAX } from "@sos-miam/commun/regles/reservations";
import type { EvenementReservation, Reservation } from "@sos-miam/commun/types/reservation";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteReservation } from "~/composants/reservations/CarteReservation";
import { EtatVideReservations } from "~/composants/reservations/EtatVideReservations";
import { PanneauApercuReservations, type ApercuReservations } from "~/composants/reservations/PanneauApercuReservations";
import { SectionReservations } from "~/composants/reservations/SectionReservations";
import { clientExempleReservations, creerReservationsExemples } from "~/contenus/reservations-exemples";
import { appliquerGesteReservation } from "~/fonctions/reservations/appliquer-geste-reservation";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { decrireAnnulationReservation, type TextesAnnulationReservation } from "~/fonctions/reservations/decrire-annulation-reservation";
import { rangerReservations } from "~/fonctions/reservations/ranger-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type AnnulationDemandee = { reservationId: number; textes: TextesAnnulationReservation };

const SOUS_TITRE =
  "Tes demandes de table et les réponses des lieux. C'est gratuit, sans carte bancaire, et si tu ne peux plus venir, tu annules d'un geste.";

const NOTE_MAXIMUM = `${RESERVATIONS_A_VENIR_MAX} réservations en cours, c'est le maximum : de quoi laisser de la place aux autres Miamis. Dès qu'une est passée ou annulée, tu peux en refaire une.`;

const compterEnCours = (liste: readonly Reservation[]) => liste.filter((r) => r.statut === "demandee" || r.statut === "acceptee").length;

export default function EcranMesReservations() {
  const router = useRouter();
  const [apercu, setApercu] = useState<ApercuReservations>("exemples");
  const [maintenantMs, setMaintenantMs] = useState(() => Date.now());
  const [reservations, setReservations] = useState(() => creerReservationsExemples(Date.now()));
  const [annulation, setAnnulation] = useState<AnnulationDemandee | null>(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);

  const affichees = apercu === "vide" ? [] : reservations;
  const { aVenir, passees } = rangerReservations(affichees, maintenantMs);

  function choisirApercu(choix: ApercuReservations) {
    const instant = Date.now();
    setMaintenantMs(instant);
    setReservations(creerReservationsExemples(instant));
    setApercu(choix);
  }

  function appliquer(reservationId: number, evenement: EvenementReservation) {
    const instant = Date.now();
    setMaintenantMs(instant);
    setReservations((liste) => liste.map((r) => (r.id === reservationId ? appliquerGesteReservation(r, evenement, instant) : r)));
  }

  function demanderAnnulation(reservation: Reservation) {
    const instant = Date.now();
    const { annulationTardive } = calculerGestesReservation(reservation, instant);
    setAnnulation({ reservationId: reservation.id, textes: decrireAnnulationReservation(reservation, annulationTardive, instant) });
    setFeuilleOuverte(true);
  }

  function signalerPresence(reservation: Reservation) {
    appliquer(reservation.id, { type: "presence" });
    AccessibilityInfo.announceForAccessibility("C'est noté, tu es sur place. Donne ton code à l'équipe.");
  }

  const ouvrirLieu = (lieuId: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(lieuId) } });

  const dessinerCarte = (reservation: Reservation) => (
    <CarteReservation
      key={reservation.id}
      reservation={reservation}
      maintenantMs={maintenantMs}
      client={clientExempleReservations}
      onAnnuler={demanderAnnulation}
      onSignalerPresence={signalerPresence}
      onOuvrirLieu={ouvrirLieu}
    />
  );

  return (
    <EcranReglage titre="Mes réservations" sousTitre={SOUS_TITRE}>
      <View className="gap-6">
        <PanneauApercuReservations apercu={apercu} onChoisir={choisirApercu} />

        {affichees.length === 0 ? <EtatVideReservations onExplorer={() => router.navigate("/explorer")} /> : null}

        {aVenir.length > 0 ? (
          <SectionReservations titre="À venir" nombre={aVenir.length}>
            {compterEnCours(aVenir) >= RESERVATIONS_A_VENIR_MAX ? (
              <Text className="rounded-2xl bg-jaune-clair px-3.5 py-2.5 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(NOTE_MAXIMUM)}</Text>
            ) : null}
            {aVenir.map(dessinerCarte)}
          </SectionReservations>
        ) : null}

        {passees.length > 0 ? (
          <SectionReservations titre="Passées" nombre={passees.length}>
            {passees.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
      </View>

      <FeuilleConfirmation
        visible={feuilleOuverte}
        emoji="🗓️"
        titre={annulation?.textes.titre ?? ""}
        detail={annulation?.textes.detail ?? ""}
        libelleConfirmer={annulation?.textes.libelleConfirmer ?? ""}
        libelleRester={annulation?.textes.libelleRester ?? ""}
        onConfirmer={() => {
          if (annulation) appliquer(annulation.reservationId, { type: "annuler-client" });
        }}
        onRefermee={() => {
          if (annulation) AccessibilityInfo.announceForAccessibility(annulation.textes.annonce);
        }}
        onFermer={() => setFeuilleOuverte(false)}
      />
    </EcranReglage>
  );
}
