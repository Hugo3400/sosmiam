import { calculerDecalageParis } from "./calculer-decalage-paris.ts";

const HEURE_MS = 60 * 60_000;

/**
 * Instant (millisecondes UTC) d'un jour « AAAA-MM-JJ » et d'une heure « HH:MM » à l'heure de Paris : sert à passer du
 * créneau choisi (« 2026-10-09 », « 20:00 ») à `Reservation.creneau` (new Date(…).toISOString()).
 * Rend NaN si le jour ou l'heure est mal écrit ou n'existe pas (« 2026-02-30 », « 24:00 »).
 */
export function calculerInstantParis(jour: string, heure: string): number {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour);
  const horaire = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!date || !horaire) return Number.NaN;
  const [annee, mois, quantieme, heures, minutes] = [date[1], date[2], date[3], horaire[1], horaire[2]].map(Number);
  if (heures > 23 || minutes > 59) return Number.NaN;

  const commeSiUtc = Date.UTC(annee, mois - 1, quantieme, heures, minutes);
  const verification = new Date(commeSiUtc);
  if (verification.getUTCMonth() !== mois - 1 || verification.getUTCDate() !== quantieme) return Number.NaN;
  // Paris est toujours en avance sur UTC (1 h ou 2 h) : on lit le décalage une heure plus tôt, puis on le retire
  return commeSiUtc - calculerDecalageParis(commeSiUtc - HEURE_MS);
}
