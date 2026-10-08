import { ID_MOI } from "@sos-miam/commun/regles/potes";

/**
 * Qui cette personne de la démo suit : ses abonnements dans le graphe d'exemple, plus toi (ID_MOI) si elle te suit.
 * Identifiants seulement : à filtrer ensuite (bloqués, inconnus, mineurs pour un adulte).
 */
export function listerAbonnementsDe(id: string, graphe: Readonly<Record<string, readonly string[]>>, mesAbonnes: readonly string[]): string[] {
  const abonnements = (graphe[id] ?? []).filter((autre) => autre !== id);
  return mesAbonnes.includes(id) ? [...abonnements, ID_MOI] : abonnements;
}
