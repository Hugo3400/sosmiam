import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Pote } from "@sos-miam/commun/types/potes";
import { convertirPersonneEnPote } from "~/fonctions/communaute/convertir-personne-en-pote";

/**
 * La personne qui a écrit un commentaire, pour son avatar, son prénom et son @pseudo : la communauté la connaît (compte
 * connecté), sinon ce que le serveur en dit (visite sans compte). null : la réponse du lieu, ou un compte supprimé.
 */
export function trouverAuteurCommentaire(commentaire: Commentaire, trouverPote: (id: string) => Pote | null): Pote | null {
  if (commentaire.auteur === "lieu" || commentaire.auteur === "") return null;
  const personne = commentaire.serveur?.personne;
  return trouverPote(commentaire.auteur) ?? (personne ? convertirPersonneEnPote(personne) : null);
}
