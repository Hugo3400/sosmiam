import { MESSAGES_ERREURS_SERVEURS } from "../../contenus/serveurs-dev.ts";
import type { ErreurApi } from "../../services/client-gestion.ts";
import { expliquerErreur } from "../texte/expliquer-erreur.ts";

export function expliquerErreurServeur(erreur: ErreurApi | null): string {
  if (!erreur) return "";
  const message = MESSAGES_ERREURS_SERVEURS[erreur.code];
  if (!message) return expliquerErreur(erreur);
  return erreur.detail ? `${message} Sa réponse : « ${erreur.detail} »` : message;
}
