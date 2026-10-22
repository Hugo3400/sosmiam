import { MAX_PASTILLE_ICONE } from "../../regles/chat.ts";
import type { PoulsSocial } from "../../types/social.ts";

export function calculerPastilleIcone(pouls: Pick<PoulsSocial, "messages" | "sorties" | "cloche">): number {
  const total = pouls.messages.nonLus + pouls.messages.invitations + pouls.sorties.nonLus + pouls.sorties.invitations + pouls.cloche.nonVues;
  return Math.max(0, Math.min(MAX_PASTILLE_ICONE, Math.floor(total)));
}
