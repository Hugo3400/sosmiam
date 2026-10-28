/**
 * Qui cette personne suit : ses abonnements dans le graphe, plus toi (monId) si elle te suit.
 * Identifiants seulement : à filtrer ensuite (bloqués, inconnus).
 */
export function listerAbonnementsDe(id: string, graphe: Readonly<Record<string, readonly string[]>>, mesAbonnes: readonly string[], monId: string): string[] {
  const abonnements = (graphe[id] ?? []).filter((autre) => autre !== id);
  return mesAbonnes.includes(id) ? [...abonnements, monId] : abonnements;
}
