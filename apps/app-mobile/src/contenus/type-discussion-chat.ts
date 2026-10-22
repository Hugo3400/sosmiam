import type { Conversation, MessageChat } from "@sos-miam/commun/types/conversations";
import type { GifApi, SondageApi } from "@sos-miam/commun/types/messagerie";

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
  album?: string;
  onde?: string;
  vote?: SondageApi;
  gif?: GifApi;
};

export type LectureChat = { membre: string; luJusqua: string; luLe?: string };

export type ConversationEnrichie = Omit<Conversation, "messages"> & {
  messages: MessageChatEnrichi[];
  epinglee?: boolean;
  lectures?: LectureChat[];
  photo?: boolean;
  fichierPhoto?: string;
};

export type PartagesChat = { messages: MessageChatEnrichi[]; suite: string | null };

export type RequeteGif = { type: "tendances" } | { type: "recherche"; q: string };

export type ResultatGifs = { gifs: GifApi[] } | { erreur: "indisponible" | "reseau" };
