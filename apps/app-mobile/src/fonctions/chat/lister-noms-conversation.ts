import type { Conversation } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";

export function listerNomsConversation(conversation: Conversation, monId: string, trouverPote: (id: string) => Pote | null, bloques: ReadonlySet<string>): string[] {
  const noms = conversation.participants
    .filter((id) => id !== monId && !bloques.has(id))
    .map(trouverPote)
    .filter((pote): pote is Pote => pote !== null)
    .flatMap((pote) => [pote.prenom, pote.pseudo]);
  if (conversation.type === "groupe") return [nommerGroupe(conversation.titre), ...noms];
  return noms.length > 0 ? noms : ["Compte supprimé"];
}
