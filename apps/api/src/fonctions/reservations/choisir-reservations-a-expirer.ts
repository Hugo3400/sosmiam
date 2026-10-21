import { calculerMargeExpirationReservation } from "../../../../../packages/commun/src/fonctions/reservations/calculer-marge-expiration-reservation.ts";
import type { ReglagesServicesReservations } from "../../../../../packages/commun/src/types/reglages-reservations.ts";

export type ReservationAExpirer = { id: number; lieuId: number; creneau: Date };

export function choisirReservationsAExpirer(
  candidates: readonly ReservationAExpirer[],
  reglages: ReadonlyMap<number, Pick<ReglagesServicesReservations, "acceptation" | "delai">>,
  maintenant: Date,
): number[] {
  const maintenantMs = maintenant.getTime();
  return candidates
    .filter((r) => r.creneau.getTime() <= maintenantMs + calculerMargeExpirationReservation(reglages.get(r.lieuId) ?? null))
    .map((r) => r.id)
    .sort((a, b) => a - b);
}
