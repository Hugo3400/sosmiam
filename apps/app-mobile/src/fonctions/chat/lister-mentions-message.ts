import { extraireMentions } from "@sos-miam/commun/fonctions/commentaires/extraire-mentions";
import { MAX_MENTIONS_MESSAGE } from "@sos-miam/commun/regles/chat";

export function listerMentionsMessage(texte: string, membres: readonly { id: string; pseudo: string }[]): string[] {
  if (!texte.includes("@") || membres.length === 0) return [];
  const parPseudo = new Map(membres.filter((m) => m.pseudo).map((m) => [m.pseudo.toLowerCase(), m.id]));
  const ids = extraireMentions(texte).flatMap((pseudo) => parPseudo.get(pseudo) ?? []);
  return [...new Set(ids)].slice(0, MAX_MENTIONS_MESSAGE);
}
