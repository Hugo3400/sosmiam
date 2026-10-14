import type { Commentaire } from "@sos-miam/commun/types/commentaires";

/** Combien de J'aime a un commentaire (démo : ceux qu'on connaît ; visite et compte : le nombre du serveur) */
export function compterJaimesCommentaire(commentaire: Commentaire): number {
  return commentaire.serveur ? commentaire.serveur.nombreJaimes : commentaire.jaimes.length;
}
