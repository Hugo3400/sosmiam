// Liens de désinscription de la newsletter (demande d'Hugo du 14 octobre 2026) : signés, sans colonne ni secret de plus.
// La sous-clé est tirée de la clé des données (chiffrement-donnees.ts) par HKDF-SHA256, une seule fois au démarrage
// (brancherCleDesinscription, appelé par demarrer.ts). Sans clé des données, pas de lien : les fonctions rendent null et
// le mail garde seulement la désinscription par mail (« STOP »).
// Ce fichier ne touche pas à la base : la session Logiciel l'importe pour ses mails (envois-newsletter.ts).
import { creerJetonDesinscription } from "../fonctions/newsletter/creer-jeton-desinscription.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

/** Contexte HKDF : changer le « v1 » invaliderait tous les liens déjà envoyés */
export const CONTEXTE_DESINSCRIPTION = "sos-miam desinscription newsletter v1";
/** La page du site, avec son bouton « Me désinscrire » (le lien du corps du mail) */
export const PAGE_DESINSCRIPTION = "https://sosmiam.fr/desinscription";
/** L'adresse « un clic » de l'API (en-tête List-Unsubscribe, RFC 8058), servie par api.sosmiam.fr */
export const ADRESSE_UN_CLIC = "https://api.sosmiam.fr/newsletter/desinscription";

let cle: Buffer | null = null;
/** Pendant un changement de la clé des données : les sous-clés tirées des anciennes clés (les liens déjà envoyés restent bons) */
let clesAnciennes: Buffer[] = [];

/** Tire la sous-clé des liens depuis la clé des données (null : pas de clé, pas de lien). Rend la sous-clé, pour les routes. */
export function brancherCleDesinscription(chiffrement: ChiffrementDonnees | null): Buffer | null {
  cle = chiffrement ? chiffrement.deriverCle(CONTEXTE_DESINSCRIPTION) : null;
  clesAnciennes = chiffrement ? chiffrement.deriverClesAnciennes(CONTEXTE_DESINSCRIPTION) : [];
  return cle;
}

/**
 * Les sous-clés des liens tirées des anciennes clés des données (après brancherCleDesinscription) : un lien signé avant
 * le changement de clé reste valable tant que l'ancienne clé est là. Vide hors changement de clé. Les nouveaux liens
 * sont toujours signés avec la clé courante.
 */
export function lireClesAnciennesDesinscription(): Buffer[] {
  return [...clesAnciennes];
}

/** « https://sosmiam.fr/desinscription?jeton=… » pour cette adresse : le lien à mettre dans le mail. Null sans clé. */
export function creerLienDesinscription(email: string): string | null {
  return cle ? `${PAGE_DESINSCRIPTION}?jeton=${creerJetonDesinscription(email, cle)}` : null;
}

/** « https://api.sosmiam.fr/newsletter/desinscription?jeton=… » : l'adresse https de l'en-tête List-Unsubscribe. Null sans clé. */
export function creerAdresseDesinscriptionUnClic(email: string): string | null {
  return cle ? `${ADRESSE_UN_CLIC}?jeton=${creerJetonDesinscription(email, cle)}` : null;
}
