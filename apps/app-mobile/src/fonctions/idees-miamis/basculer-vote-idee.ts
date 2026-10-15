import type { IdeeMiamis } from "@sos-miam/commun/types/idees";

export function basculerVoteIdee(idee: IdeeMiamis, oui: boolean): IdeeMiamis {
  if (idee.aVote === oui) return idee;
  return { ...idee, aVote: oui, votes: Math.max(0, idee.votes + (oui ? 1 : -1)) };
}
