/** Le début du détail de chaque mouvement des points de la photo d'un avis */
const DEBUTS = { ecrit: "avis", masque: "avis masqué", retabli: "avis rétabli" } as const;

/**
 * Le détail d'une ligne du journal des points (raison « avis-photo ») : il relie chaque mouvement à son avis, et le journal
 * se relit à ce détail EXACT (sommerPointsPhoto de avis-regles.ts). « avis <id>, lieu <lieuId> » pour les +10 posés à
 * l'écriture de l'avis (le même depuis la création des avis, le 09/10), « avis masqué … » au masquage, « avis rétabli … »
 * au retour en ligne. Des lignes existent déjà en base : ce format ne change jamais.
 */
export function ecrireDetailPointsAvis(a: { id: number; lieuId: number }, mouvement: keyof typeof DEBUTS = "ecrit"): string {
  return `${DEBUTS[mouvement]} ${a.id}, lieu ${a.lieuId}`;
}
