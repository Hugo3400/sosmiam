import { POINTS_AMBASSADEUR } from "../../regles/ambassadeurs.ts";
import type { ReglementVisite } from "../../types/visite.ts";

/**
 * Points d'une visite validée : +25 si un SOS était en cours au moment de la demande (à la place des +15), sinon +15.
 * Une visite offerte par le lieu ne rapporte rien (décidé le 9 octobre 2026) ; une réduction compte comme payée.
 */
export function calculerPointsVisite(pendantSos: boolean, reglement: ReglementVisite | null = null): number {
  if (reglement?.type === "offert") return 0;
  return pendantSos ? POINTS_AMBASSADEUR.visiteSos : POINTS_AMBASSADEUR.visite;
}
