import type { ConversationApi } from "@sos-miam/commun/types/messagerie";
import type { ConversationEnrichie, LectureChat, MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { convertirMessageApi } from "~/fonctions/chat/convertir-message-api";

/**
 * Une conversation privée ou de groupe telle que l'API la rend, au format des écrans du chat : les participants par leur
 * identifiant public (toi compris ; en privé, l'autre aussi s'il a quitté la bande), les admins et les invités en attente,
 * les non-lus comptés par le serveur. messages : le fil déjà lu s'il y en a un, sinon le dernier message seulement.
 */
export function convertirConversationApi(c: ConversationApi, fil?: { messages: MessageChatEnrichi[]; plusAnciens: boolean }): ConversationEnrichie {
  const participants = c.membres.map((m) => m.personne.id);
  if (c.autre && !participants.includes(c.autre.id)) participants.push(c.autre.id);
  const lectures = c.membres.flatMap((m): LectureChat[] => (m.luJusqua ? [{ membre: m.personne.id, luJusqua: m.luJusqua, ...(m.luLe ? { luLe: m.luLe } : {}) }] : []));
  return {
    id: c.id,
    type: c.type === "prive" ? "prive" : "groupe",
    ...(c.titre !== null ? { titre: c.titre } : {}),
    ...(c.emoji !== null ? { emoji: c.emoji } : {}),
    participants,
    creePar: c.membres.find((m) => m.role === "admin")?.personne.id ?? "",
    messages: fil ? fil.messages : c.dernierMessage ? [convertirMessageApi(c.dernierMessage)] : [],
    nonLus: c.nonLus,
    ouverte: c.ouverte,
    coupee: c.coupee,
    admins: c.membres.filter((m) => m.role === "admin").map((m) => m.personne.id),
    invites: c.invites.map((p) => p.id),
    plusAnciens: fil?.plusAnciens ?? false,
    epinglee: c.epinglee === true,
    ...(lectures.length > 0 ? { lectures } : {}),
  };
}
