const MINUTE = 60_000;

/**
 * Le temps qu'il reste à une addition demandée : « Expire dans 27 min », « Expire dans moins d'une minute », puis « Expirée ».
 * Arrondi à la minute du dessus (il reste 26 min 10 s : « 27 min »), pour ne jamais annoncer moins qu'en vrai.
 */
export function decrireAttenteAddition(expireLe: string, maintenant: Date = new Date()): string {
  const resteMs = Date.parse(expireLe) - maintenant.getTime();
  if (!Number.isFinite(resteMs) || resteMs <= 0) return "Expirée";
  if (resteMs < MINUTE) return "Expire dans moins d'une minute";
  return `Expire dans ${Math.ceil(resteMs / MINUTE)} min`;
}
