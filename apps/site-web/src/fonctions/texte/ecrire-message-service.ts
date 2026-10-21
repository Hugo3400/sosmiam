import { MESSAGES_SERVICE } from "../../../../../packages/commun/src/contenus/messages-services.ts";
import type { ErreurService } from "../../../../../packages/commun/src/types/erreurs-service.ts";

export function ecrireMessageService(code: ErreurService): string {
  const { titre, texte } = MESSAGES_SERVICE[code];
  return /[.!?…]$/.test(titre) ? `${titre} ${texte}` : `${titre}. ${texte}`;
}
