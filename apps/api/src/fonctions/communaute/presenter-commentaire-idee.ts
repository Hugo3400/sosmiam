import type { CommentaireIdee } from "../../../../../packages/commun/src/types/idees.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import type { LigneCommentaireIdee } from "../../services/communaute-regles.ts";

export function presenterCommentaireIdee(l: LigneCommentaireIdee, auteur: PersonneResume, reponseVisible = true): CommentaireIdee {
  return {
    id: String(l.id),
    ideeId: String(l.ideeId),
    auteur,
    texte: l.texte,
    date: l.creeLe.toISOString(),
    jaime: l.jaimes,
    aime: l.aime,
    reponseA: l.reponseAId !== null && reponseVisible ? String(l.reponseAId) : null,
  };
}
