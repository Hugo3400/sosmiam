import type { Sortie } from "@sos-miam/commun/types/potes";
import type { SortieApi } from "@sos-miam/commun/types/sorties";

/**
 * Une sortie telle que l'API la rend, au format des écrans (les personnes par leur identifiant public : trouverPote les
 * connaît). La discussion est la conversation conversationId : messages reste vide. Un vote clos avant l'heure (par
 * l'organisateur) finit maintenant, pour qu'estVoteTermine dise la même chose partout.
 */
export function convertirSortieApi(s: SortieApi, maintenant: Date): Sortie {
  const closAvantLHeure = s.voteTermine && Date.parse(s.finVote) > maintenant.getTime();
  return {
    id: s.id,
    titre: s.titre,
    emoji: s.emoji,
    quand: s.quand,
    finVote: closAvantLHeure ? maintenant.toISOString() : s.finVote,
    organisateur: s.organisateur?.id ?? "",
    participants: s.participants.map((p) => p.id),
    propositions: s.propositions.map((p) => ({ lieuId: p.lieuId, proposePar: p.proposePar?.id ?? "", votes: p.votes.map((v) => v.id), nombreVotes: p.nombreVotes })),
    lieuChoisi: s.lieuChoisi,
    messages: [],
    conversationId: s.conversationId,
    invites: s.invites.map((p) => p.id),
    voteTermine: s.voteTermine,
    nonLus: s.nonLus,
  };
}
