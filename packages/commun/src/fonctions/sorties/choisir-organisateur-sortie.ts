/** Instant d'arrivée ; une date illisible passe en dernier */
function lireArrivee(depuis: string): number {
  const instant = Date.parse(depuis);
  return Number.isNaN(instant) ? Number.POSITIVE_INFINITY : instant;
}

/**
 * Qui organise la sortie : l'organisateur, tant qu'il en est encore participant ; sinon (il est parti, ou a supprimé son
 * compte : null) le plus ancien participant (arrivé le premier ; à égalité, le plus petit identifiant) ; null s'il ne
 * reste personne (la sortie est alors effacée). participants : ceux qui ont accepté, avec leur date d'arrivée.
 */
export function choisirOrganisateurSortie(organisateur: string | null, participants: readonly { id: string; depuis: string }[]): string | null {
  if (organisateur !== null && participants.some((p) => p.id === organisateur)) return organisateur;
  const restants = participants.filter((p) => p.id !== organisateur);
  if (restants.length === 0) return null;
  return restants.reduce((a, b) => {
    const ecart = lireArrivee(b.depuis) - lireArrivee(a.depuis);
    return ecart < 0 || (ecart === 0 && b.id < a.id) ? b : a;
  }).id;
}
