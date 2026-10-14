import { CODES_REACTIONS, REACTIONS_PAR_CODE } from "../../regles/chat.ts";
import type { CodeReaction } from "../../types/messagerie.ts";

/** Sans le sélecteur de variante (U+FE0F) : « ❤ » et « ❤️ » sont le même cœur */
const sansVariante = (texte: string) => texte.replace(/\u{FE0F}/gu, "");

/** L'emoji d'une réaction (❤️, 😂, 🤤, 👍, 😮) en code de l'API (coeur, rire, miam, pouce, surprise) ; null s'il n'en est pas une */
export function convertirReactionEnCode(reaction: string): CodeReaction | null {
  const cherchee = sansVariante(reaction);
  return CODES_REACTIONS.find((code) => sansVariante(REACTIONS_PAR_CODE[code]) === cherchee) ?? null;
}
