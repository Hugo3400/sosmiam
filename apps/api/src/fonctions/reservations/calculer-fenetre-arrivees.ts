import { calculerInstantParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import { VENU_APRES_CRENEAU_MS } from "../../../../../packages/commun/src/regles/reservations.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/** Plus long qu'un jour de changement d'heure (25 h) : depuis minuit, on tombe toujours le lendemain */
const VINGT_SIX_HEURES_MS = 26 * 3600_000;

/**
 * Les créneaux « du jour » au comptoir : depuis minuit (heure de Paris) ou depuis 4 h, si c'est plus tôt (après minuit, on
 * voit encore les tables de la soirée tant que « Venu » est possible), jusqu'au minuit suivant (exclu), même les jours de
 * changement d'heure.
 */
export function calculerFenetreArrivees(maintenant: Date): { depuis: Date; avant: Date } {
  const minuit = calculerInstantParis(calculerClesPeriodes(maintenant).jour, "00:00");
  const minuitSuivant = calculerInstantParis(calculerClesPeriodes(new Date(minuit + VINGT_SIX_HEURES_MS)).jour, "00:00");
  return { depuis: new Date(Math.min(minuit, maintenant.getTime() - VENU_APRES_CRENEAU_MS)), avant: new Date(minuitSuivant) };
}
