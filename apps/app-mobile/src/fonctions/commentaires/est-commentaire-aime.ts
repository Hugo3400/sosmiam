import type { Commentaire } from "@sos-miam/commun/types/commentaires";

/** Vrai si tu as aimé ce commentaire (compte connecté : le serveur le dit ; sinon : tu es dans ses J'aime) */
export function estCommentaireAime(commentaire: Commentaire, monId: string): boolean {
  return commentaire.serveur ? commentaire.serveur.aimeParMoi : commentaire.jaimes.includes(monId);
}
