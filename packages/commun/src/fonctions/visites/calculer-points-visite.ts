import { POINTS_AMBASSADEUR } from "../../regles/ambassadeurs.ts";

/** Points d'une visite validée : +25 si un SOS était en cours au moment de la demande (à la place des +15), sinon +15. */
export function calculerPointsVisite(pendantSos: boolean): number {
  return pendantSos ? POINTS_AMBASSADEUR.visiteSos : POINTS_AMBASSADEUR.visite;
}
