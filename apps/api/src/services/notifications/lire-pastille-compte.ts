import { calculerPastilleIcone } from "../../../../../packages/commun/src/fonctions/messagerie/calculer-pastille-icone.ts";
import type { PoulsSocial } from "../../../../../packages/commun/src/types/social.ts";

export type LirePastille = (compteId: number) => Promise<number>;

export function creerLecteurPastille(lirePouls: (compteId: number, maintenant: Date) => Promise<PoulsSocial>, horloge: () => number = Date.now): LirePastille {
  return async (compteId) => calculerPastilleIcone(await lirePouls(compteId, new Date(horloge())));
}
