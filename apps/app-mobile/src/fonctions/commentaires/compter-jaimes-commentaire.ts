import type { Commentaire } from "@sos-miam/commun/types/commentaires";

/** Combien de J'aime a un commentaire (visite et compte : le nombre du serveur ; sinon : ceux qu'on connaît) */
export function compterJaimesCommentaire(commentaire: Commentaire): number {
  return commentaire.serveur ? commentaire.serveur.nombreJaimes : commentaire.jaimes.length;
}
