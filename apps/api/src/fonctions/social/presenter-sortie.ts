import type { SortieApi } from "../../../../../packages/commun/src/types/sorties.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import type { DonneesSortie } from "./assembler-sortie.ts";
import { estVisiblePourMoi } from "./est-visible-pour-moi.ts";

/** Ce que voit la personne qui lit : les personnes en petit, ses blocages (dans les deux sens) et ses non-lus */
export type VueSortie = { moi: number; personnes: ReadonlyMap<number, PersonneResume>; caches: ReadonlySet<number>; nonLus: number; maintenant: Date };

/**
 * Une sortie telle qu'un PARTICIPANT la voit (un invité qui n'a pas répondu ne voit que presenterInvitationSortie).
 * Participants et invitations en attente restent nommés ; les votes et la proposition d'une personne avec qui il y a un
 * blocage ne sont pas nommés, mais comptent dans nombreVotes (c'est lui qui décide du lieu retenu). Un compte sans profil
 * social (ou supprimé) n'apparaît pas. Vote terminé : par l'organisateur, par la tâche de la minute, ou finVote passé.
 */
export function presenterSortie(s: DonneesSortie, vue: VueSortie): SortieApi {
  const nommer = (ids: readonly number[]) => ids.flatMap((id) => {
    const personne = vue.personnes.get(id);
    return personne ? [personne] : [];
  });
  const visible = (id: number | null) => (id !== null && estVisiblePourMoi(id, vue.caches) ? (vue.personnes.get(id) ?? null) : null);
  return {
    id: String(s.id),
    titre: s.titre,
    emoji: s.emoji,
    quand: s.quand.toISOString(),
    finVote: s.finVote.toISOString(),
    organisateur: s.organisateurEffectif === null ? null : (vue.personnes.get(s.organisateurEffectif) ?? null),
    participants: nommer(s.participants),
    invites: nommer(s.invites),
    propositions: s.propositions.map((p) => ({
      lieuId: p.lieuId,
      proposePar: visible(p.proposeParId),
      votes: nommer(p.votants.filter((id) => estVisiblePourMoi(id, vue.caches))),
      nombreVotes: p.votants.length,
    })),
    lieuChoisi: s.lieuChoisiId,
    voteTermine: s.voteTermineLe !== null || s.finVote.getTime() <= vue.maintenant.getTime(),
    conversationId: String(s.conversationId),
    nonLus: vue.nonLus,
    version: s.version,
    moi: { organisateur: s.organisateurEffectif === vue.moi },
  };
}
