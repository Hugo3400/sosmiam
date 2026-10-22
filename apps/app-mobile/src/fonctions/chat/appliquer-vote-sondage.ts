import type { SondageApi } from "@sos-miam/commun/types/messagerie";

export function appliquerVoteSondage(vote: SondageApi, ordre: number | null): SondageApi {
  const avant = vote.monVote;
  if (avant === ordre || (ordre !== null && !vote.options.some((o) => o.ordre === ordre))) return vote;
  const options = vote.options.map((o) => ({ ...o, votes: Math.max(0, o.votes - (o.ordre === avant ? 1 : 0) + (o.ordre === ordre ? 1 : 0)) }));
  const votants = Math.max(0, vote.votants + (avant === null ? 1 : 0) - (ordre === null ? 1 : 0));
  return { ...vote, options, monVote: ordre, votants };
}
