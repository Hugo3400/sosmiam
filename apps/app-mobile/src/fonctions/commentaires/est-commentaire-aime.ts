import type { Commentaire } from "@sos-miam/commun/types/commentaires";

/** Vrai si tu as aimé ce commentaire (démo : tu es dans ses J'aime ; compte connecté : le serveur le dit) */
export function estCommentaireAime(commentaire: Commentaire, monId: string): boolean {
  return commentaire.serveur ? commentaire.serveur.aimeParMoi : commentaire.jaimes.includes(monId);
}
