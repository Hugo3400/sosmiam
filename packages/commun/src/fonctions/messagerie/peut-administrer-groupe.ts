import type { MembreGroupe, TypeConversation } from "../../types/messagerie.ts";

/** Instant d'arrivée ; une date illisible passe en dernier */
function lireArrivee(depuis: string): number {
  const instant = Date.parse(depuis);
  return Number.isNaN(instant) ? Number.POSITIVE_INFINITY : instant;
}

/**
 * Vrai si « moi » (identifiant public) peut inviter, retirer, renommer et nommer des admins. Groupes seulement : toujours
 * faux pour un privé ou la discussion d'une sortie (ses membres changent par la sortie). Seuls comptent ceux qui ont
 * accepté (statut « accepte ») : un invité qui n'a pas encore répondu n'administre jamais rien (réponse de Hugo du
 * 14/10/2026). Un admin, oui ; dans un groupe sans admin, le plus ancien membre (arrivé le premier ; à égalité, le plus
 * petit identifiant).
 */
export function peutAdministrerGroupe(type: TypeConversation, moi: string, membres: readonly MembreGroupe[]): boolean {
  if (type !== "groupe") return false;
  const presents = membres.filter((m) => m.statut === "accepte");
  const moiMembre = presents.find((m) => m.id === moi);
  if (!moiMembre) return false;
  if (moiMembre.role === "admin") return true;
  if (presents.some((m) => m.role === "admin")) return false;
  const plusAncien = presents.reduce((a, b) => {
    const ecart = lireArrivee(b.depuis) - lireArrivee(a.depuis);
    return ecart < 0 || (ecart === 0 && b.id < a.id) ? b : a;
  });
  return plusAncien.id === moi;
}
