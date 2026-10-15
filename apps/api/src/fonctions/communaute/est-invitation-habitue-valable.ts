import { HEURES_INVITATION_HABITUES } from "../../../../../packages/commun/src/regles/communaute.ts";

export function estInvitationHabitueValable(p: { statut: string; creeLe: Date }, maintenant: Date): boolean {
  return p.statut === "invite" && maintenant.getTime() < p.creeLe.getTime() + HEURES_INVITATION_HABITUES * 3_600_000;
}
