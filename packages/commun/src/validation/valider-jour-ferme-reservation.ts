import { JOURS_FERMES_HORIZON } from "../regles/reglages-reservations.ts";
import { calculerEcartJoursParis } from "../fonctions/temps/calculer-ecart-jours-paris.ts";
import { lireJourSemaine } from "../fonctions/temps/lire-jour-semaine.ts";

export function validerJourFermeReservation(jour: unknown, maintenant: Date): string | null {
  if (typeof jour !== "string" || lireJourSemaine(jour) === null) return null;
  const ecart = calculerEcartJoursParis(jour, maintenant.getTime());
  return ecart === null || ecart < 0 || ecart > JOURS_FERMES_HORIZON ? null : jour;
}
