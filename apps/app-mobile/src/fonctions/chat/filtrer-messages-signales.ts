import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";

export function filtrerMessagesSignales(messages: readonly MessageChatEnrichi[], estSignale: (id: string) => boolean): MessageChatEnrichi[] {
  const albums = new Set(messages.filter((m) => !!m.album && (m.idClient ?? m.id) === m.album && estSignale(m.id)).map((m) => m.album));
  return messages.filter((m) => !estSignale(m.id) && !(m.album && albums.has(m.album)));
}
