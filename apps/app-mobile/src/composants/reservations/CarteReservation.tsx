import { Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { ActionsReservation } from "~/composants/reservations/ActionsReservation";
import { BlocArriveeReservation } from "~/composants/reservations/BlocArriveeReservation";
import { EnTeteReservation } from "~/composants/reservations/EnTeteReservation";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { expliquerReservation } from "~/fonctions/reservations/expliquer-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  client: { prenom: string; avatar: string };
  onAnnuler: (reservation: Reservation) => void;
  onSignalerPresence: (reservation: Reservation) => void;
  onOuvrirLieu: (lieuId: number) => void;
};

export function CarteReservation({ reservation, maintenantMs, client, onAnnuler, onSignalerPresence, onOuvrirLieu }: Props) {
  const gestes = calculerGestesReservation(reservation, maintenantMs);
  const explication = expliquerReservation(reservation, gestes.presence);
  const enRetrait = reservation.statut === "annulee" || reservation.statut === "expiree";
  const enCours = reservation.statut === "acceptee" || gestes.presence;
  const annulation = gestes.annuler ? (reservation.statut === "demandee" ? "demande" : "reservation") : null;

  return (
    <View className={`gap-3 rounded-carte border-2 bg-white p-4 ${enRetrait ? "border-ligne" : "border-encre"}`}>
      <EnTeteReservation reservation={reservation} maintenantMs={maintenantMs} enRetrait={enRetrait} />

      {explication ? <Text className="font-texte text-[15px] leading-6 text-encre">{lierPonctuation(explication)}</Text> : null}

      {reservation.message ? (
        <View accessible className="rounded-2xl bg-creme px-3 py-2.5">
          <Text className="font-texte-semi text-[12px] text-gris">Ton petit mot</Text>
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(`« ${reservation.message} »`)}</Text>
        </View>
      ) : null}

      {enCours ? (
        <BlocArriveeReservation
          reservation={reservation}
          presencePossible={gestes.presence}
          client={client}
          onSignalerPresence={() => onSignalerPresence(reservation)}
        />
      ) : null}

      <ActionsReservation
        nomLieu={reservation.lieu.nom}
        annulation={annulation}
        onOuvrirLieu={() => onOuvrirLieu(reservation.lieu.id)}
        onAnnuler={() => onAnnuler(reservation)}
      />
    </View>
  );
}
