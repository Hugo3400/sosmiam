import type { EtatJourReservation } from "@sos-miam/commun/types/reglages-reservations";

export type RaisonSansCreneau = Exclude<EtatJourReservation, "ouvert">;

export function lireRaisonSansCreneau(etat: EtatJourReservation, creneauxLibres: number | null = null): RaisonSansCreneau | null {
  if (etat !== "ouvert") return etat;
  return creneauxLibres === 0 ? "complet" : null;
}
