import { MESSAGES_SERVICE, type MessageService } from "../../../../../packages/commun/src/contenus/messages-services.ts";
import { TEXTES_IMAGES_LIEU } from "../../contenus/pro-images-lieu.ts";
import type { MessageImageLieu } from "../../types/images-lieu.ts";
import { expliquerCompteLimite } from "../compte/expliquer-compte-limite.ts";

const MESSAGES = MESSAGES_SERVICE as Readonly<Record<string, MessageService>>;

const PROPRES_AU_GERANT = new Set(["reserve-au-gerant", "role-requis", "pas-pro"]);

export function choisirMessageImageLieu(erreur: string, jusqua: string | null = null): MessageImageLieu {
  const T = TEXTES_IMAGES_LIEU.erreurs;
  if (erreur === "session-expiree") return T.session;
  if (erreur === "hors-ligne") return T.reseau;
  if (PROPRES_AU_GERANT.has(erreur)) return T.reserveAuGerant;
  if (erreur === "stockage-plein") return T.stockagePlein;
  if (erreur === "compte-limite") return { titre: T.compteLimite, texte: expliquerCompteLimite(jusqua) };
  const message = (Object.hasOwn(MESSAGES, erreur) ? MESSAGES[erreur] : undefined) ?? MESSAGES_SERVICE["erreur-serveur"];
  return { titre: message.titre, texte: message.texte };
}
