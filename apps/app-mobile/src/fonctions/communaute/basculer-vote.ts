import type { Sortie } from "@sos-miam/commun/types/potes";

/** Ajoute ou retire le vote de quelqu'un pour un lieu d'une sortie (chacun peut voter pour plusieurs lieux). */
export function basculerVote(sortie: Sortie, lieuId: number, qui: string): Sortie {
  return {
    ...sortie,
    propositions: sortie.propositions.map((p) =>
      p.lieuId !== lieuId ? p : { ...p, votes: p.votes.includes(qui) ? p.votes.filter((v) => v !== qui) : [...p.votes, qui] },
    ),
  };
}
