import { useEffect, useRef } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { CarteReservation } from "~/composants/reservations/CarteReservation";
import { EncadreReservation } from "~/composants/reservations/EncadreReservation";
import { TitreEtapeReservation } from "~/composants/reservations/TitreEtapeReservation";
import { TEXTES_DEMANDE_ENVOYEE } from "~/contenus/textes-reserver-table";
import { ecrireHeureParis } from "~/fonctions/dates/ecrire-heure-paris";
import { lireHorairesReservation } from "~/fonctions/reservations/lire-horaires-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  client: { prenom: string; avatar: string };
  presenceEnCours: string | null;
  onAnnuler: (reservation: Reservation) => void;
  onSignalerPresence: (reservation: Reservation) => void;
  onVoirReservations: () => void;
  onRetourFiche: () => void;
  onAutreCreneau: () => void;
};

function dessinerEtapes() {
  return (
    <View className="gap-3">
      <TitreEtapeReservation titre={TEXTES_DEMANDE_ENVOYEE.etapesTitre} />
      {TEXTES_DEMANDE_ENVOYEE.etapes.map((etape) => (
        <View key={etape.emoji} className="flex-row items-start gap-3">
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-jaune-clair"
          >
            <Text className="text-base">{etape.emoji}</Text>
          </View>
          <Text className="flex-1 pt-2 font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(etape.texte)}</Text>
        </View>
      ))}
    </View>
  );
}

export function DemandeEnvoyeeReservation(props: Props) {
  const { reservation, maintenantMs, client, presenceEnCours, onVoirReservations, onRetourFiche, onAutreCreneau } = props;
  const enAttente = reservation.statut === "demandee";
  const tientToujours = enAttente || reservation.statut === "acceptee" || reservation.statut === "honoree";
  const { planB } = lireHorairesReservation(reservation);
  const accepteeDesLEnvoi = reservation.statut === "acceptee";
  const annonceDepart = useRef(accepteeDesLEnvoi ? TEXTES_DEMANDE_ENVOYEE.annonceAcceptee : TEXTES_DEMANDE_ENVOYEE.annonce);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(annonceDepart.current);
  }, []);

  return (
    <View className="gap-6">
      {tientToujours ? (
        <View className="items-center">
          <Mascotte expression="clin" taille={120} flotte />
        </View>
      ) : null}

      {planB ? (
        <EncadreReservation
          ton="doux"
          emoji="🔁"
          titre={TEXTES_DEMANDE_ENVOYEE.planBRetenuTitre}
          texte={remplirModele(TEXTES_DEMANDE_ENVOYEE.planBRetenu, { premier: ecrireHeureParis(planB.premier), retenu: ecrireHeureParis(reservation.creneau) })}
        />
      ) : null}

      <CarteReservation
        reservation={reservation}
        maintenantMs={maintenantMs}
        client={client}
        presenceEnCours={presenceEnCours}
        avecVoirLieu={false}
        onAnnuler={props.onAnnuler}
        onSignalerPresence={props.onSignalerPresence}
        onOuvrirLieu={onRetourFiche}
      />

      {enAttente ? dessinerEtapes() : null}

      <View className="gap-3">
        {tientToujours ? (
          <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.voirReservations} onPress={onVoirReservations} />
        ) : (
          <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.autreCreneau} onPress={onAutreCreneau} />
        )}
        <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.retourFiche} variante="blanc" onPress={onRetourFiche} />
      </View>
    </View>
  );
}
