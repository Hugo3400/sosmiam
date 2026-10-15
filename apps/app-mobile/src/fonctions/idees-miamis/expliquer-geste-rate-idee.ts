import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { TEXTES_IDEES } from "~/contenus/textes-idees";

const PANNES: readonly ErreurService[] = ["hors-ligne", "erreur-serveur", "service-indisponible"];

export function expliquerGesteRateIdee(erreur: ErreurService, geste: keyof typeof TEXTES_IDEES.rates): string {
  if (PANNES.includes(erreur)) return TEXTES_IDEES.rates[geste];
  return MESSAGES_SERVICE[erreur]?.titre ?? TEXTES_IDEES.rates[geste];
}
