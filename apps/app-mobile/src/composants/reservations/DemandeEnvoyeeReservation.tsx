import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { CarteReservation } from "~/composants/reservations/CarteReservation";
import { TitreEtapeReservation } from "~/composants/reservations/TitreEtapeReservation";
import { TEXTES_DEMANDE_ENVOYEE } from "~/contenus/textes-reserver-table";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  client: { prenom: string; avatar: string };
  onAnnuler: (reservation: Reservation) => void;
  onVoirReservations: () => void;
  onRetourFiche: () => void;
  onAutreCreneau: () => void;
};

export function DemandeEnvoyeeReservation({ reservation, maintenantMs, client, onAnnuler, onVoirReservations, onRetourFiche, onAutreCreneau }: Props) {
  const enAttente = reservation.statut === "demandee";

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(TEXTES_DEMANDE_ENVOYEE.annonce);
  }, []);

  return (
    <View className="gap-6">
      {enAttente ? (
        <View className="items-center">
          <Mascotte expression="clin" taille={120} flotte />
        </View>
      ) : null}

      <CarteReservation
        reservation={reservation}
        maintenantMs={maintenantMs}
        client={client}
        onAnnuler={onAnnuler}
        onSignalerPresence={() => {}}
        onOuvrirLieu={onRetourFiche}
      />

      {enAttente ? (
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
      ) : null}

      <View className="gap-3">
        {enAttente ? (
          <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.voirReservations} onPress={onVoirReservations} />
        ) : (
          <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.autreCreneau} onPress={onAutreCreneau} />
        )}
        <Bouton libelle={TEXTES_DEMANDE_ENVOYEE.retourFiche} variante="blanc" onPress={onRetourFiche} />
      </View>
    </View>
  );
}
