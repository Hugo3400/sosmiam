/** Rien à attendre avant le 5e échec consécutif ; ensuite 1 s, 2 s, 4 s… jamais plus de 15 minutes */
const ECHECS_LIBRES = 5;
const ATTENTE_MAX = 15 * 60;

/** Secondes à attendre avant un nouvel essai de mot de passe, après `echecs` échecs consécutifs sur le même compte. */
export function calculerAttenteConnexion(echecs: number): number {
  if (echecs < ECHECS_LIBRES) return 0;
  return Math.min(2 ** (echecs - ECHECS_LIBRES), ATTENTE_MAX);
}
