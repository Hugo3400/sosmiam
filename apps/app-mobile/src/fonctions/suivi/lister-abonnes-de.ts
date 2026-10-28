/**
 * Qui suit cette personne : ceux qui la suivent dans le graphe, plus toi (monId) si tu la suis.
 * Identifiants seulement : à filtrer ensuite (bloqués, inconnus).
 */
export function listerAbonnesDe(id: string, graphe: Readonly<Record<string, readonly string[]>>, mesAbonnements: readonly string[], monId: string): string[] {
  const abonnes = Object.keys(graphe).filter((autre) => autre !== id && graphe[autre].includes(id));
  return mesAbonnements.includes(id) ? [...abonnes, monId] : abonnes;
}
