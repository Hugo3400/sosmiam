import type { Pote } from "@sos-miam/commun/types/potes";

/** Photos et notes vocales : interdites dans une conversation qui mêle mineurs et adultes (protection des 15-17 ans). */
export function peutEnvoyerMedias(participants: Pote[]): boolean {
  const mineurs = participants.filter((p) => p.mineur).length;
  return mineurs === 0 || mineurs === participants.length;
}
