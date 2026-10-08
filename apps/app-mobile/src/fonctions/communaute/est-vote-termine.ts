import type { Sortie } from "@sos-miam/commun/types/potes";

/** Vrai quand le vote d'une sortie est fini : un lieu est déjà retenu (« Terminer le vote »), ou l'heure de fin est passée. */
export function estVoteTermine(sortie: Pick<Sortie, "lieuChoisi" | "finVote">, maintenant: Date = new Date()): boolean {
  return sortie.lieuChoisi !== null || new Date(sortie.finVote).getTime() <= maintenant.getTime();
}
