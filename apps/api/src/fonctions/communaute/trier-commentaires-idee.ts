import type { LigneCommentaireIdee } from "../../services/communaute-regles.ts";

export function trierCommentairesIdee(commentaires: readonly LigneCommentaireIdee[]): LigneCommentaireIdee[] {
  const ids = new Set(commentaires.map((c) => c.id));
  const estReponse = (c: LigneCommentaireIdee) => c.reponseAId !== null && ids.has(c.reponseAId);
  const parDate = (a: LigneCommentaireIdee, b: LigneCommentaireIdee) => a.creeLe.getTime() - b.creeLe.getTime() || a.id - b.id;
  const premiers = commentaires.filter((c) => !estReponse(c)).sort((a, b) => b.jaimes - a.jaimes || parDate(a, b));
  return premiers.flatMap((p) => [p, ...commentaires.filter((c) => estReponse(c) && c.reponseAId === p.id).sort(parDate)]);
}
