import type { MessagePush } from "../../services/notifications/expedier-push.ts";

export function ecrirePushRappelSortie(s: { sortieId: number; conversationId: number; titre: string }): MessagePush {
  return {
    titre: `⏰ ${s.titre}`,
    texte: "C'est dans 1 h !",
    lien: `/potes/sortie/${s.sortieId}`,
    regroupement: `conversation:${s.conversationId}`,
  };
}
