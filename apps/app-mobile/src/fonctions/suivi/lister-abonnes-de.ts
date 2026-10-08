import { ID_MOI } from "@sos-miam/commun/regles/potes";

/**
 * Qui suit cette personne de la démo : ceux qui la suivent dans le graphe d'exemple, plus toi (ID_MOI) si tu la suis.
 * Identifiants seulement : à filtrer ensuite (bloqués, inconnus, mineurs pour un adulte).
 */
export function listerAbonnesDe(id: string, graphe: Readonly<Record<string, readonly string[]>>, mesAbonnements: readonly string[]): string[] {
  const abonnes = Object.keys(graphe).filter((autre) => autre !== id && graphe[autre].includes(id));
  return mesAbonnements.includes(id) ? [...abonnes, ID_MOI] : abonnes;
}
