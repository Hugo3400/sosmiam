import type { ReglagesServicesReservations } from "../../types/reglages-reservations.ts";
import type { StatutReservation } from "../../types/reservation.ts";
import { calculerMargeExpirationReservation } from "./calculer-marge-expiration-reservation.ts";
import { lireCreneauxProposes } from "./lire-creneaux-proposes.ts";

export function calculerLimiteReponseReservation(
  r: { statut: StatutReservation; creneau: string; creneauxProposes?: readonly string[] },
  reglages: Pick<ReglagesServicesReservations, "acceptation" | "delai"> | null,
): string | null {
  if (r.statut !== "demandee") return null;
  const plusTot = Math.min(Date.parse(r.creneau), ...lireCreneauxProposes(r).map((c) => Date.parse(c)));
  return Number.isNaN(plusTot) ? null : new Date(plusTot - calculerMargeExpirationReservation(reglages)).toISOString();
}
