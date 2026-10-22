import { LONGUEUR_MAX_MESSAGE } from "@sos-miam/commun/regles/potes";
import { MAX_BROUILLONS_CHAT, type BrouillonsChat } from "~/contenus/type-brouillon-chat";

export function placerBrouillonChat(brouillons: BrouillonsChat, conversationId: string, texte: string, le: string): BrouillonsChat {
  if (!conversationId) return brouillons;
  const garde = Array.from(texte).slice(0, LONGUEUR_MAX_MESSAGE).join("");
  const vide = garde.trim().length === 0;
  const avant = brouillons.get(conversationId);
  if (vide ? !avant : avant?.texte === garde) return brouillons;
  const suite = new Map(brouillons);
  suite.delete(conversationId);
  if (!vide) suite.set(conversationId, { texte: garde, le });
  for (const id of suite.keys()) {
    if (suite.size <= MAX_BROUILLONS_CHAT) break;
    suite.delete(id);
  }
  return suite;
}
