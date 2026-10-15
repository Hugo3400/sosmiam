import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { REFUS_LIMITATION_IDEES, TEXTES_IDEES } from "~/contenus/textes-idees";

const PANNES: readonly ErreurService[] = ["hors-ligne", "erreur-serveur", "service-indisponible"];

export function expliquerRefusCommentaireIdee(erreur: ErreurService): { limite: boolean; texte: string } {
  if (erreur === "compte-limite") return { limite: true, texte: REFUS_LIMITATION_IDEES.commentaire };
  if (erreur === "message-refuse") return { limite: false, texte: TEXTES_IDEES.erreursCommentaire["mot-interdit"] };
  if (erreur === "commentaire-inconnu") return { limite: false, texte: TEXTES_IDEES.erreursCommentaire["reponse-perdue"] };
  if (PANNES.includes(erreur)) return { limite: false, texte: TEXTES_IDEES.erreursCommentaire.reseau };
  const message = MESSAGES_SERVICE[erreur];
  return { limite: false, texte: message ? `${message.titre}. ${message.texte}` : TEXTES_IDEES.erreursCommentaire.reseau };
}
