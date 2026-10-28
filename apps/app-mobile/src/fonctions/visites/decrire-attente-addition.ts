import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";

import { TEXTES_DEMANDE_ADDITION_PAR_LANGUE } from "~/contenus/textes-demande-addition";

const MINUTE = 60_000;

/**
 * Le temps qu'il reste à une addition demandée : « Expire dans 27 min », « Expire dans moins d'une minute », puis « Expirée ».
 * Arrondi à la minute du dessus (il reste 26 min 10 s : « 27 min »), pour ne jamais annoncer moins qu'en vrai.
 */
export function decrireAttenteAddition(expireLe: string, langue: Langue, maintenant: Date = new Date()): string {
  const T = choisirTextes(TEXTES_DEMANDE_ADDITION_PAR_LANGUE, langue);
  const resteMs = Date.parse(expireLe) - maintenant.getTime();
  if (!Number.isFinite(resteMs) || resteMs <= 0) return T.expiree;
  if (resteMs < MINUTE) return T.expireBientot;
  return T.expireDans(Math.ceil(resteMs / MINUTE));
}
