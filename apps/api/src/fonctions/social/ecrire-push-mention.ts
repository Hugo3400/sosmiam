import type { TypeConversation } from "../../../../../packages/commun/src/types/messagerie.ts";
import type { MessagePush } from "../../services/notifications/expedier-push.ts";

export function ecrirePushMention(m: { prenom: string; conversation: { id: number; type: TypeConversation; titre: string | null }; sortieId?: number | null }): MessagePush {
  const discussion = `/potes/discussion/${m.conversation.id}`;
  const sortie = m.conversation.type === "sortie";
  return {
    titre: sortie ? `🎉 ${m.conversation.titre ?? "Ta sortie"}` : `💬 ${m.conversation.titre ?? "Ton groupe"}`,
    texte: `${m.prenom} t'a mentionné.`,
    lien: sortie && m.sortieId ? `/potes/sortie/${m.sortieId}` : discussion,
    regroupement: `conversation:${m.conversation.id}`,
  };
}
