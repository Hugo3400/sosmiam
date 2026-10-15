import type { Reservation } from "@sos-miam/commun/types/reservation";

export function compterReservationsEnCours(reservations: readonly Reservation[], maintenantMs: number): number {
  return reservations.filter((r) => (r.statut === "demandee" || r.statut === "acceptee") && Date.parse(r.creneau) >= maintenantMs).length;
}
