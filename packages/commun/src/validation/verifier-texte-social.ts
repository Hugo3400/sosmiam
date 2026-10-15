import { contientMotInterdit } from "./contient-mot-interdit.ts";
import { estTexteAffichable } from "./est-texte-affichable.ts";

// Les caractères invisibles glissés dans un mot (« con​nard », trait d'union conditionnel) : le filtre de mots relit
// aussi le texte sans eux
const INVISIBLES_DANS_UN_MOT = /[\p{Cf}\p{Default_Ignorable_Code_Point}]/gu;

/**
 * Vérifie un texte de la partie sociale (message, petit mot, titre, description, commentaire), nettoyé avec trim :
 * « vide » (rien de visible, ou un caractère de contrôle autre que la tabulation et le retour à la ligne : voir
 * estTexteAffichable), « trop-long » (au-delà de max), « mot-interdit » (filtre de mots, même avec des caractères
 * invisibles entre les lettres), sinon « ok ». La même règle sert dans l'app (réponse tout de suite) et dans l'API
 * (« vide » et « trop-long » y deviennent 400 champ-invalide, « mot-interdit » 400 message-refuse).
 */
export function verifierTexteSocial(texte: string, max: number): "ok" | "vide" | "trop-long" | "mot-interdit" {
  const propre = texte.trim();
  if (!estTexteAffichable(propre)) return "vide";
  if (propre.length > max) return "trop-long";
  const sansInvisibles = propre.replace(INVISIBLES_DANS_UN_MOT, "");
  if (contientMotInterdit(propre) || (sansInvisibles !== propre && contientMotInterdit(sansInvisibles))) return "mot-interdit";
  return "ok";
}
