import { EXPIRATION_DELAI_COURT_MS } from "../../regles/reglages-reservations.ts";
import { EXPIRATION_AVANT_CRENEAU_MS } from "../../regles/reservations.ts";
import type { ReglagesServicesReservations } from "../../types/reglages-reservations.ts";

export function calculerMargeExpirationReservation(reglages: Pick<ReglagesServicesReservations, "acceptation" | "delai"> | null): number {
  return reglages?.acceptation === "manuelle" && reglages.delai === "30-min" ? EXPIRATION_DELAI_COURT_MS : EXPIRATION_AVANT_CRENEAU_MS;
}
