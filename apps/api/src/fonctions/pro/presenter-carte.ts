// La carte d'un lieu telle que l'API la rend (espace pro, mode pro de l'app, fiche publique).
import type { CarteLieu } from "../../../../../packages/commun/src/types/carte.ts";
import { calculerClesPeriodes } from "../dates/calculer-cles-periodes.ts";

export type CartePresentee = {
  /** La carte, avec `majLe` au format de packages/commun (« AAAA-MM-JJ », jour de Paris) ; null : pas de carte */
  carte: CarteLieu | null;
  /** Le moment exact de la dernière mise à jour (ISO 8601), ou null */
  majLe: string | null;
};

/** Met la date de mise à jour (gardée à part, posée par le serveur) dans la carte gardée. */
export function presenterCarte(carte: Omit<CarteLieu, "majLe"> | null, majLe: Date | null): CartePresentee {
  if (carte === null) return { carte: null, majLe: null };
  return {
    carte: { sections: carte.sections, ...(majLe ? { majLe: calculerClesPeriodes(majLe).jour } : {}) },
    majLe: majLe?.toISOString() ?? null,
  };
}
