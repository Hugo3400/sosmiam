import { VENU_APRES_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";

export function estReservationNonPointee(reservation: Pick<Reservation, "statut" | "creneau">, maintenantMs: number): boolean {
  const creneauMs = Date.parse(reservation.creneau);
  return reservation.statut === "acceptee" && !Number.isNaN(creneauMs) && maintenantMs > creneauMs + VENU_APRES_CRENEAU_MS;
}
