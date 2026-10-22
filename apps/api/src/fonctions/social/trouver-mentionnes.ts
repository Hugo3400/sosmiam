import { extraireMentions } from "../../../../../packages/commun/src/fonctions/commentaires/extraire-mentions.ts";
import { MAX_MENTIONS_MESSAGE } from "../../../../../packages/commun/src/regles/chat.ts";

export function trouverMentionnes(texte: string, membres: readonly { compteId: number; pseudo: string }[]): number[] {
  if (!texte.includes("@") || membres.length === 0) return [];
  const parPseudo = new Map(membres.map((m) => [m.pseudo.toLowerCase(), m.compteId]));
  const trouves = extraireMentions(texte).flatMap((pseudo) => parPseudo.get(pseudo) ?? []);
  return [...new Set(trouves)].slice(0, MAX_MENTIONS_MESSAGE);
}
