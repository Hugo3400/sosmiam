import type { Reservation } from "@sos-miam/commun/types/reservation";

import { estReservationNonPointee } from "~/fonctions/reservations/est-reservation-non-pointee";
import { rangerReservations } from "~/fonctions/reservations/ranger-reservations";

export function listerReservationsEnCours(reservations: readonly Reservation[], maintenantMs: number): Reservation[] {
  return rangerReservations(reservations, maintenantMs).aVenir.filter(
    (r) => (r.statut === "demandee" || r.statut === "acceptee" || r.statut === "honoree") && !estReservationNonPointee(r, maintenantMs),
  );
}
