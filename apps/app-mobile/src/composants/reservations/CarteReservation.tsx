import { Text, View } from "react-native";

import type { Reservation } from "@sos-miam/commun/types/reservation";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { ActionsReservation } from "~/composants/reservations/ActionsReservation";
import { BlocArriveeReservation } from "~/composants/reservations/BlocArriveeReservation";
import { EnTeteReservation } from "~/composants/reservations/EnTeteReservation";
import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";
import { doitPrevenirAlcoolReservation } from "~/fonctions/reservations/doit-prevenir-alcool-reservation";
import { estLieuDisparu } from "~/fonctions/reservations/est-lieu-disparu";
import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";
import { expliquerReservation } from "~/fonctions/reservations/expliquer-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reservation: Reservation;
  maintenantMs: number;
  client: { prenom: string; avatar: string };
  presenceEnCours?: string | null;
  avecVoirLieu?: boolean;
  onAnnuler: (reservation: Reservation) => void;
  onSignalerPresence: (reservation: Reservation) => void;
  onOuvrirLieu: (lieuId: number) => void;
};

export function CarteReservation(props: Props) {
  const { reservation, maintenantMs, client, presenceEnCours = null, avecVoirLieu = true } = props;
  const gestes = calculerGestesReservation(reservation, maintenantMs);
  const explication = expliquerReservation(reservation, gestes.presence, maintenantMs);
  const nonPointee = estReservationNonPointee(reservation, maintenantMs);
  const enRetrait = reservation.statut === "annulee" || reservation.statut === "expiree" || nonPointee;
  const enCours = (reservation.statut === "acceptee" && !nonPointee) || gestes.presence;
  const annulation = gestes.annuler && !reservation.presenceLe ? (reservation.statut === "demandee" ? "demande" : "reservation") : null;
  const voirLieu = avecVoirLieu && !estLieuDisparu(reservation.lieu);

  return (
    <View className={`gap-3 rounded-carte border-2 bg-carte p-4 ${enRetrait ? "border-ligne" : "border-encre"}`}>
      <EnTeteReservation reservation={reservation} maintenantMs={maintenantMs} enRetrait={enRetrait} />

      {doitPrevenirAlcoolReservation(reservation.lieu.type, reservation.message) ? <MentionPrevention variante="courte" /> : null}

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
          presenceEnCours={presenceEnCours}
          client={client}
          onSignalerPresence={() => props.onSignalerPresence(reservation)}
        />
      ) : null}

      <ActionsReservation
        nomLieu={reservation.lieu.nom}
        annulation={annulation}
        onOuvrirLieu={voirLieu ? () => props.onOuvrirLieu(reservation.lieu.id) : null}
        onAnnuler={() => props.onAnnuler(reservation)}
      />
    </View>
  );
}
