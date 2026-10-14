import { CODES_REACTIONS, REACTIONS_PAR_CODE } from "../../regles/chat.ts";
import type { ReactionChat } from "../../types/conversations.ts";

/** Le code d'une réaction de l'API (coeur, rire, miam, pouce, surprise) en emoji affiché ; null pour un code inconnu */
export function convertirCodeEnReaction(code: string): ReactionChat | null {
  const connu = CODES_REACTIONS.find((c) => c === code);
  return connu ? REACTIONS_PAR_CODE[connu] : null;
}
