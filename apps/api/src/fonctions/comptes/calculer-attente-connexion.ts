/**
 * Rien à attendre avant le 5e échec consécutif ; ensuite 2 min, 4 min, 8 min… jamais plus de 2 heures. C'est plus d'une
 * minute après 5 échecs, et 21 essais au plus sur 24 heures (CNIL, délibération 2022-100, §43 : 25 au plus).
 */
const ECHECS_LIBRES = 5;
const ATTENTE_DEPART = 2 * 60;
const ATTENTE_MAX = 2 * 3600;

/** Secondes à attendre avant un nouvel essai de mot de passe, après `echecs` échecs consécutifs sur le même compte. */
export function calculerAttenteConnexion(echecs: number): number {
  if (echecs < ECHECS_LIBRES) return 0;
  return Math.min(ATTENTE_DEPART * 2 ** (echecs - ECHECS_LIBRES), ATTENTE_MAX);
}
