import { DUREE_SANS_FIN_MS, OCCURRENCES_EVENEMENT_MAX } from "../../regles/evenements.ts";
import { calculerDecalageParis } from "../temps/calculer-decalage-paris.ts";
import { calculerInstantParis } from "../temps/calculer-instant-paris.ts";

type Instant = Date | string;

/** Ce qu'il faut d'un événement pour connaître ses dates */
export type RepetitionEvenement = { debut: Instant; fin: Instant | null; hebdoJusqua: Instant | null };

const enMs = (instant: Instant) => new Date(instant).getTime();

/** Le jour (« AAAA-MM-JJ », décalé de `jours`) et l'heure (« HH:MM ») à Paris de cet instant */
function lireJourHeureParis(instantMs: number, jours: number): { jour: string; heure: string } {
  const local = new Date(instantMs + calculerDecalageParis(instantMs));
  const jour = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + jours));
  return { jour: jour.toISOString().slice(0, 10), heure: local.toISOString().slice(11, 16) };
}

/**
 * Les dates d'un événement qui touchent la période [du, au) et qui ne sont pas encore finies à `du` : la seule, ou, pour un
 * événement de chaque semaine, chaque date au même jour de la semaine et à la même heure de Paris (aussi après un
 * changement d'heure), jusqu'à hebdoJusqua compris. Une date sans fin compte comme finie 3 h après son début
 * (DUREE_SANS_FIN_MS) ; la durée de la première date vaut pour toutes. Rendues dans l'ordre, OCCURRENCES_EVENEMENT_MAX au plus.
 */
export function listerOccurrencesEvenement(e: RepetitionEvenement, du: Date, au: Date): { debut: Date; fin: Date | null }[] {
  const debutMs = enMs(e.debut);
  if (Number.isNaN(debutMs)) return [];
  const dureeMs = e.fin === null ? null : enMs(e.fin) - debutMs;
  const dernierMs = e.hebdoJusqua === null ? debutMs : enMs(e.hebdoJusqua);
  const occurrences: { debut: Date; fin: Date | null }[] = [];

  for (let semaine = 0; semaine < OCCURRENCES_EVENEMENT_MAX; semaine++) {
    let ms = debutMs;
    if (semaine > 0) {
      const { jour, heure } = lireJourHeureParis(debutMs, 7 * semaine);
      ms = calculerInstantParis(jour, heure);
    }
    if (Number.isNaN(ms) || ms > dernierMs || ms >= au.getTime()) break;
    const finMs = ms + (dureeMs ?? DUREE_SANS_FIN_MS);
    if (finMs > du.getTime()) occurrences.push({ debut: new Date(ms), fin: dureeMs === null ? null : new Date(finMs) });
  }
  return occurrences;
}
