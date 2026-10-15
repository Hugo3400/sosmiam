import type { IdeeMiamis } from "../../../../../packages/commun/src/types/idees.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import type { LigneIdee } from "../../services/communaute-regles.ts";

export function presenterIdeeMiamis(l: LigneIdee, personnes: ReadonlyMap<number, PersonneResume>, votants: PersonneResume[] = []): IdeeMiamis {
  return {
    id: String(l.id),
    titre: l.titre,
    detail: l.detail,
    auteur: l.auteurId !== null ? (personnes.get(l.auteurId) ?? null) : null,
    date: (l.publieeLe ?? l.creeLe).toISOString(),
    statut: l.statut,
    votes: l.votes,
    aVote: l.aVote,
    votants,
    commentaires: l.commentaires,
    reponseBrigade: l.reponseBrigade && l.reponduLe ? { texte: l.reponseBrigade, date: l.reponduLe.toISOString() } : null,
    ideeDuMois: l.ideeDuMois,
  };
}
