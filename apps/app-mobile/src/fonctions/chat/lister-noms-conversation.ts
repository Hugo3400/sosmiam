import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Conversation } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";

export function listerNomsConversation(conversation: Conversation, monId: string, trouverPote: (id: string) => Pote | null, bloques: ReadonlySet<string>, langue: Langue): string[] {
  const noms = conversation.participants
    .filter((id) => id !== monId && !bloques.has(id))
    .map(trouverPote)
    .filter((pote): pote is Pote => pote !== null)
    .flatMap((pote) => [pote.prenom, pote.pseudo]);
  if (conversation.type === "groupe") return [nommerGroupe(conversation.titre, langue), ...noms];
  return noms.length > 0 ? noms : [choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue).compteSupprime];
}
