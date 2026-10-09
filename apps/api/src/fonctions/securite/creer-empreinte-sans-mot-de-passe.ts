import { creerJeton } from "./creer-jeton.ts";

/** Début des empreintes « sans mot de passe » (estSansMotDePasse) : jamais celui d'une vraie empreinte (« scrypt$… ») */
export const PREFIXE_SANS_MOT_DE_PASSE = "aucun$";

/**
 * L'empreinte gardée pour un compte créé avec Apple ou Google : « aucun$ » suivi de 32 octets aléatoires jetés aussitôt.
 * Aucun mot de passe ne la vérifie (verifierMotDePasse ne lit que « scrypt$… ») ; « Mot de passe oublié » permet d'en
 * choisir un vrai.
 */
export function creerEmpreinteSansMotDePasse(): string {
  return `${PREFIXE_SANS_MOT_DE_PASSE}${creerJeton()}`;
}
