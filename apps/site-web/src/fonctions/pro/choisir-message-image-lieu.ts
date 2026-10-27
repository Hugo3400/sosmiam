import { MESSAGES_SERVICE_PAR_LANGUE, type MessageService } from "../../../../../packages/commun/src/contenus/messages-services.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { LANGUE_PAR_DEFAUT, type Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "../../contenus/pro-images-lieu.ts";
import type { MessageImageLieu } from "../../types/images-lieu.ts";
import { expliquerCompteLimite } from "../compte/expliquer-compte-limite.ts";

const PROPRES_AU_GERANT = new Set(["reserve-au-gerant", "role-requis", "pas-pro"]);

export function choisirMessageImageLieu(erreur: string, jusqua: string | null = null, langue: Langue = LANGUE_PAR_DEFAUT): MessageImageLieu {
  const T = choisirTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE, langue).erreurs;
  const MESSAGES = choisirTextes(MESSAGES_SERVICE_PAR_LANGUE, langue) as Readonly<Record<string, MessageService>>;
  if (erreur === "session-expiree") return T.session;
  if (erreur === "hors-ligne") return T.reseau;
  if (PROPRES_AU_GERANT.has(erreur)) return T.reserveAuGerant;
  if (erreur === "stockage-plein") return T.stockagePlein;
  if (erreur === "compte-limite") return { titre: T.compteLimite, texte: expliquerCompteLimite(jusqua, langue) };
  const message = (Object.hasOwn(MESSAGES, erreur) ? MESSAGES[erreur] : undefined) ?? MESSAGES["erreur-serveur"];
  return { titre: message.titre, texte: message.texte };
}
