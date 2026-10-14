/**
 * Règle des blocages DANS LES DEUX SENS (décidé le 8 octobre 2026) : un message, une réaction, un vote, une ligne d'activité
 * n'est visible pour moi que si son auteur n'a aucun blocage avec moi, ni de lui vers moi ni de moi vers lui. `caches` :
 * l'union des deux (RelationsSociales.listerBlocages). Un auteur supprimé (null, « Compte supprimé ») reste visible.
 */
export function estVisiblePourMoi(auteurId: number | null, caches: ReadonlySet<number>): boolean {
  return auteurId === null || !caches.has(auteurId);
}
