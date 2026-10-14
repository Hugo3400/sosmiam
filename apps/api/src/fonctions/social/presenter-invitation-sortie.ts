import type { InvitationSortieApi } from "../../../../../packages/commun/src/types/sorties.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import type { DonneesSortie } from "./assembler-sortie.ts";

/**
 * Ce que voit un invité qui n'a pas encore répondu (« Tu viens ? ») : titre, emoji, date, organisateur, qui l'invite et le
 * nombre de participants ; ni les propositions, ni les votes, ni la discussion. invitation : sa propre ligne.
 */
export function presenterInvitationSortie(
  s: DonneesSortie,
  invitation: { inviteParId: number | null; creeLe: Date },
  personnes: ReadonlyMap<number, PersonneResume>,
): InvitationSortieApi {
  return {
    id: String(s.id),
    titre: s.titre,
    emoji: s.emoji,
    quand: s.quand.toISOString(),
    organisateur: s.organisateurEffectif === null ? null : (personnes.get(s.organisateurEffectif) ?? null),
    invitePar: invitation.inviteParId === null ? null : (personnes.get(invitation.inviteParId) ?? null),
    participants: s.participants.length,
    date: invitation.creeLe.toISOString(),
  };
}
