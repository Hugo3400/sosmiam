import { PRESENCE_APRES_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";

import { calculerGestesReservation } from "~/fonctions/reservations/calculer-gestes-reservation";

export type ReservationsRangees = { aVenir: Reservation[]; passees: Reservation[] };

function estAVenir(reservation: Reservation, maintenantMs: number): boolean {
  const creneauMs = Date.parse(reservation.creneau);
  if (Number.isNaN(creneauMs)) return false;
  switch (reservation.statut) {
    case "acceptee":
      return maintenantMs <= creneauMs + PRESENCE_APRES_CRENEAU_MS;
    case "honoree":
      return calculerGestesReservation(reservation, maintenantMs).presence;
    case "absent":
      return false;
    default:
      return maintenantMs < creneauMs;
  }
}

const trierParCreneau = (a: Reservation, b: Reservation) => Date.parse(a.creneau) - Date.parse(b.creneau);

export function rangerReservations(reservations: readonly Reservation[], maintenantMs: number): ReservationsRangees {
  const aVenir = reservations.filter((r) => estAVenir(r, maintenantMs)).sort(trierParCreneau);
  const passees = reservations.filter((r) => !estAVenir(r, maintenantMs)).sort((a, b) => trierParCreneau(b, a));
  return { aVenir, passees };
}
