import { MESSAGES_SERVICE_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/messages-services.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { ErreurService } from "../../../../../packages/commun/src/types/erreurs-service.ts";

export function ecrireMessageService(code: ErreurService, langue: Langue = LANGUE_PAR_DEFAUT): string {
  const { titre, texte } = MESSAGES_SERVICE_PAR_LANGUE[langue][code];
  return /[.!?…]$/.test(titre) ? `${titre} ${texte}` : `${titre}. ${texte}`;
}
