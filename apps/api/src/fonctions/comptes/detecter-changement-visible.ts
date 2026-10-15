/** Le prénom, le pseudo et l'avatar : ce que les autres voient d'un compte */
type Visible = { prenom: string; pseudo: string | null; avatar: string | null };

/**
 * Vraie si la modification CHANGE le prénom, le pseudo ou l'avatar (refusé à un compte limité). Un champ absent, ou
 * renvoyé tel quel (l'app renvoie le profil entier), ne change rien ; retirer son avatar (null) reste permis : c'est
 * retirer quelque chose, pas montrer du nouveau.
 */
export function detecterChangementVisible(modification: Partial<Visible>, actuel: Visible): boolean {
  if (modification.prenom !== undefined && modification.prenom !== actuel.prenom) return true;
  if (modification.pseudo !== undefined && modification.pseudo !== actuel.pseudo) return true;
  return modification.avatar !== undefined && modification.avatar !== null && modification.avatar !== actuel.avatar;
}
