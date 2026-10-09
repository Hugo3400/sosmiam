import { calculerInstantParis } from "../../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

/** Plus long qu'un jour de changement d'heure (25 h) : depuis minuit, on tombe toujours le lendemain */
const VINGT_SIX_HEURES_MS = 26 * 3600_000;

/** Le jour de Paris qui contient `instant` : de minuit (compris) au minuit suivant (exclu), même les jours de changement d'heure. */
export function calculerBornesJourParis(instant: Date): { debut: Date; fin: Date } {
  const debut = calculerInstantParis(calculerClesPeriodes(instant).jour, "00:00");
  const fin = calculerInstantParis(calculerClesPeriodes(new Date(debut + VINGT_SIX_HEURES_MS)).jour, "00:00");
  return { debut: new Date(debut), fin: new Date(fin) };
}
