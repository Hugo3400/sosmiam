import type { Lieu } from "@sos-miam/commun/types/lieu";

const JOUR = 24 * 60;
/** Une soirée court de 6 h à 6 h le lendemain : un SOS « jusqu'à 0 h 30 » finit cette nuit, pas ce matin */
const DEBUT_JOURNEE = 6 * 60;

/** Minutes écoulées depuis 6 h (le début de la journée), pour un instant donné en minutes depuis minuit */
const depuisLeMatin = (minutes: number) => (minutes - DEBUT_JOURNEE + JOUR) % JOUR;

/** Vrai si le lieu a un SOS et que son heure de fin n'est pas encore passée (une fin entre minuit et 6 h compte pour cette nuit). */
export function estSosEnCours(lieu: Lieu, maintenant: Date = new Date()): boolean {
  if (!lieu.sos) return false;
  const [h, m] = lieu.sos.jusqua.split(":").map(Number);
  const instant = maintenant.getHours() * 60 + maintenant.getMinutes();
  return depuisLeMatin(instant) < depuisLeMatin(h * 60 + m);
}
