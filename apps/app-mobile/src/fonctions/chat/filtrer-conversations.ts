import type { Conversation } from "@sos-miam/commun/types/conversations";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";

export function filtrerConversations<C extends Conversation>(conversations: C[], recherche: string, listerNoms: (conversation: C) => readonly string[]): C[] {
  const cherche = normaliserRecherche(recherche.replace(/@/g, " "));
  if (!cherche) return conversations;
  return conversations.filter((conversation) => listerNoms(conversation).some((nom) => normaliserRecherche(nom).includes(cherche)));
}
