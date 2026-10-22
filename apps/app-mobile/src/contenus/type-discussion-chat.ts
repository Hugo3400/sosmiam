import type { Conversation, MessageChat } from "@sos-miam/commun/types/conversations";

export type EtatCitationChat = "visible" | "supprime" | "masque" | "retire" | "illisible";

export type CitationChat = {
  id: string;
  auteur: string | null;
  type: MessageChat["type"];
  extrait: string | null;
  etat: EtatCitationChat;
};

export type MessageChatEnrichi = MessageChat & {
  reponseA?: CitationChat;
  modifieLe?: string;
  legende?: string;
  systeme?: string;
  mentions?: string[];
};

export type LectureChat = { membre: string; luJusqua: string; luLe?: string };

export type ConversationEnrichie = Omit<Conversation, "messages"> & {
  messages: MessageChatEnrichi[];
  epinglee?: boolean;
  lectures?: LectureChat[];
};
