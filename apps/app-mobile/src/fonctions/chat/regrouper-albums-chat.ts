import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";

export type GroupeAlbumChat = { message: MessageChatEnrichi; album: MessageChatEnrichi[] | null };

const ETATS_CACHES = new Set(["supprime", "masque", "retire", "illisible"]);

const estCache = (m: MessageChatEnrichi) => m.etat !== undefined && ETATS_CACHES.has(m.etat);

export function regrouperAlbumsChat(messages: readonly MessageChatEnrichi[]): GroupeAlbumChat[] {
  const series: MessageChatEnrichi[][] = [];
  for (const message of messages) {
    const serie = series[series.length - 1];
    const premier = serie?.[0];
    if (
      premier &&
      message.type === "photo" &&
      premier.type === "photo" &&
      !!message.album &&
      premier.album === message.album &&
      premier.auteur === message.auteur &&
      !message.systeme
    ) {
      serie.push(message);
      continue;
    }
    series.push([message]);
  }
  return series.map((serie) => {
    if (serie.length === 1) return { message: serie[0], album: null };
    return { message: serie.find((m) => !estCache(m)) ?? serie[0], album: serie };
  });
}
