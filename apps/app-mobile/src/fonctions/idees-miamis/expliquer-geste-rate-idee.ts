import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { TEXTES_IDEES_PAR_LANGUE, type TEXTES_IDEES } from "~/contenus/textes-idees";

const PANNES: readonly ErreurService[] = ["hors-ligne", "erreur-serveur", "service-indisponible"];

export function expliquerGesteRateIdee(erreur: ErreurService, geste: keyof typeof TEXTES_IDEES.rates, langue: Langue): string {
  const T = choisirTextes(TEXTES_IDEES_PAR_LANGUE, langue);
  if (PANNES.includes(erreur)) return T.rates[geste];
  return choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[erreur]?.titre ?? T.rates[geste];
}
