import type { ErreurService } from "../types/erreurs-service.ts";
import { COMPTE_RENDU_MAX, COMPTE_RENDU_MIN } from "../regles/avis.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

/**
 * Vérifie le compte rendu d'une mission d'ambassadeur : de 5 à 2000 caractères (espaces autour retirés), sans insulte.
 * Rend « compte-rendu-invalide » ou null.
 */
export function validerCompteRendu(texte: string): ErreurService | null {
  if (typeof texte !== "string") return "compte-rendu-invalide";
  const propre = texte.trim();
  if (propre.length < COMPTE_RENDU_MIN || propre.length > COMPTE_RENDU_MAX || contientMotInterdit(propre)) {
    return "compte-rendu-invalide";
  }
  return null;
}
