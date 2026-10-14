import { calculerSignatureDesinscription } from "./calculer-signature-desinscription.ts";

/**
 * Jeton du lien « Me désinscrire » d'une adresse : base64url(adresse en minuscules) + « . » + base64url(signature). Il ne
 * dépend que de l'adresse et de la clé : rien à garder en base, et il reste valable tant que la clé ne change pas.
 */
export function creerJetonDesinscription(email: string, cle: Uint8Array): string {
  const adresse = email.trim().toLowerCase();
  return `${Buffer.from(adresse, "utf8").toString("base64url")}.${calculerSignatureDesinscription(adresse, cle).toString("base64url")}`;
}
