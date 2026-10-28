import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { REFUS_LIMITATION_IDEES_PAR_LANGUE, TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";

const PANNES: readonly ErreurService[] = ["hors-ligne", "erreur-serveur", "service-indisponible"];

export function expliquerRefusIdee(erreur: ErreurService, langue: Langue): { limite: boolean; texte: string } {
  const T = choisirTextes(TEXTES_IDEES_PAR_LANGUE, langue);
  if (erreur === "compte-limite") return { limite: true, texte: choisirTextes(REFUS_LIMITATION_IDEES_PAR_LANGUE, langue).idee };
  if (erreur === "message-refuse") return { limite: false, texte: T.erreurs["mot-interdit"] };
  if (PANNES.includes(erreur)) return { limite: false, texte: T.erreurs.reseau };
  const message = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue)[erreur];
  return { limite: false, texte: message ? `${message.titre}. ${message.texte}` : T.erreurs.reseau };
}
