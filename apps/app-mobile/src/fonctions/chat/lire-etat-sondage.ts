import type { SondageApi } from "@sos-miam/commun/types/messagerie";

export function lireEtatSondage(vote: SondageApi, maintenant: Date): { clos: boolean; gagnant: number | null } {
  if (vote.closLe !== null) return { clos: true, gagnant: vote.gagnant };
  if (Date.parse(vote.finLe) > maintenant.getTime()) return { clos: false, gagnant: null };
  let gagnant: { ordre: number; votes: number } | null = null;
  for (const option of [...vote.options].sort((a, b) => a.ordre - b.ordre)) {
    if (option.votes > 0 && (!gagnant || option.votes > gagnant.votes)) gagnant = { ordre: option.ordre, votes: option.votes };
  }
  return { clos: true, gagnant: gagnant?.ordre ?? null };
}
