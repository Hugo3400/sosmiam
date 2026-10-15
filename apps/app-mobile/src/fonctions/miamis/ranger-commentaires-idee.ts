import type { CommentaireIdee } from "@sos-miam/commun/types/idees";

export type FilCommentaireIdee = { commentaire: CommentaireIdee; reponses: CommentaireIdee[] };

export function rangerCommentairesIdee(commentaires: readonly CommentaireIdee[]): FilCommentaireIdee[] {
  const ids = new Set(commentaires.map((c) => c.id));
  const premiers = commentaires.filter((c) => c.reponseA === null || !ids.has(c.reponseA));
  return [...premiers]
    .sort((a, b) => b.jaime - a.jaime || Date.parse(b.date) - Date.parse(a.date))
    .map((commentaire) => ({
      commentaire,
      reponses: commentaires.filter((c) => c.reponseA === commentaire.id).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    }));
}
