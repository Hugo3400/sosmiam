import type { MessagePush } from "../../services/notifications/expedier-push.ts";

export function ecrirePushSondageClos(c: { conversationId: number; titre: string | null }): MessagePush {
  return {
    titre: `🍝 ${c.titre ?? "Ton groupe"}`,
    texte: "Le sondage est fini, va voir qui gagne !",
    lien: `/potes/discussion/${c.conversationId}`,
    regroupement: `conversation:${c.conversationId}`,
  };
}
