import type { ErreurService } from "../types/erreurs-service.ts";
import { REPONSE_LIEU_MAX } from "../regles/avis.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

/**
 * Vérifie la réponse publique d'un lieu à un avis : pas vide, 600 caractères au plus (espaces autour retirés), sans
 * insulte. Rend « message-refuse » ou null (il n'y a pas de code d'erreur propre aux réponses : l'écran limite déjà la
 * longueur, seul le filtre de mots peut vraiment refuser). Le droit de répondre (gérant, une réponse par avis) est
 * vérifié par le service.
 */
export function validerReponseAvis(texte: string): ErreurService | null {
  if (typeof texte !== "string") return "message-refuse";
  const propre = texte.trim();
  if (propre.length === 0 || propre.length > REPONSE_LIEU_MAX || contientMotInterdit(propre)) return "message-refuse";
  return null;
}
