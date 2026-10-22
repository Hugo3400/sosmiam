import type { Conversation } from "@sos-miam/commun/types/conversations";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export function filtrerConversations(conversations: Conversation[], recherche: string, listerNoms: (conversation: Conversation) => readonly string[]): Conversation[] {
  const cherche = normaliserRecherche(recherche.replace(/@/g, " "));
  if (!cherche) return conversations;
  return conversations.filter((conversation) => listerNoms(conversation).some((nom) => normaliserRecherche(nom).includes(cherche)));
}
