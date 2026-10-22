import type { MessageApi } from "../../../../packages/commun/src/types/messagerie.ts";
import type { LectureMessagerie } from "./messagerie-lecture.ts";
import type { ContexteMessagerie, RefusVote } from "./messagerie-regles.ts";

const refus = <E extends string>(erreur: E) => ({ ok: false as const, erreur });

export function creerSondagesMessagerie(c: ContexteMessagerie, lecture: LectureMessagerie) {
  return {
    async voterSondage(moi: number, conversationId: number, messageId: number, ordre: number | null, maintenant: Date): Promise<
      { ok: true; message: MessageApi; version: number } | { ok: false; erreur: RefusVote }> {
      const visible = await lecture.lireMessageVisible(moi, conversationId, messageId);
      const m = visible?.message;
      if (!m || m.type !== "vote" || m.systeme !== null || m.supprimeLe || m.suspenduLe || m.retireLe) return refus("message-inconnu");
      const acces = await lecture.lireAcces(moi, conversationId);
      if (!acces) return refus("message-inconnu");
      const r = await c.depot.ecrire(async (t): Promise<{ refus: RefusVote } | { version: number }> => {
        if (!(await t.verrouillerConversation(conversationId))) return { refus: "message-inconnu" };
        const sondage = (await t.lireSondages([messageId])).get(messageId);
        if (!sondage) return { refus: "message-inconnu" };
        if (sondage.closLe !== null || sondage.finLe.getTime() <= maintenant.getTime()) return { refus: "sondage-clos" };
        if (ordre !== null && !sondage.options.some((o) => o.ordre === ordre)) return { refus: "option-inconnue" };
        if (!(await lecture.estOuverte(t, moi, acces))) return { refus: "conversation-fermee" };
        const change = ordre === null ? await t.retirerVoteSondage(messageId, moi) : await t.voterSondage(messageId, moi, ordre, maintenant);
        const version = change ? await t.toucherConversation(conversationId, maintenant, false) : null;
        return { version: version ?? (await t.lireConversations([conversationId])).get(conversationId)?.version ?? acces.conversation.version };
      });
      if ("refus" in r) return refus(r.refus);
      const { caches } = await c.relations.listerBlocages(moi);
      const [message] = await lecture.presenterMessages(moi, [m], caches, maintenant) as [MessageApi];
      return { ok: true, message, version: r.version };
    },
  };
}
