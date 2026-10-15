import type { PropositionReservationPro } from "../../types/reservation.ts";

export function choisirHoraireParDefaut(propositions: readonly PropositionReservationPro[], personnes: number): string | null {
  return propositions.find((p) => p.places === null || p.places >= personnes)?.creneau ?? null;
}
