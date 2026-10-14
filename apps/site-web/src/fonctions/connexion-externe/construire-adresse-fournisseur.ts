// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import type { FournisseurExterne } from "../../types/connexion-externe.ts";

const ADRESSES = {
  google: "https://accounts.google.com/o/oauth2/v2/auth",
  apple: "https://appleid.apple.com/auth/authorize",
} satisfies Record<FournisseurExterne, string>;

type Demande = {
  fournisseur: FournisseurExterne;
  /** Google : l'identifiant client Web ; Apple : le « Services ID » */
  clientId: string;
  /** L'adresse de retour exacte, déclarée chez le fournisseur (https://<hôte>/connexion/<fournisseur>/retour) */
  adresseRetour: string;
  state: string;
  /** Le nonce tel qu'il doit être ENVOYÉ : brut pour Google, son SHA-256 hexadécimal pour Apple (voir calculerEmpreinteNonce) */
  nonceEnvoye: string;
};

/**
 * L'adresse où envoyer la personne chez Apple ou Google (OpenID Connect, réponse en form_post, sans secret client) :
 * - Google : response_type=id_token, scope « openid email profile », prompt=select_account (choisir son compte) ;
 * - Apple : response_type « code id_token », scope « name email » (le code n'est jamais utilisé : seul le jeton compte).
 */
export function construireAdresseFournisseur({ fournisseur, clientId, adresseRetour, state, nonceEnvoye }: Demande): string {
  const parametres = new URLSearchParams({ client_id: clientId, redirect_uri: adresseRetour, response_mode: "form_post", state, nonce: nonceEnvoye });
  if (fournisseur === "google") {
    parametres.set("response_type", "id_token");
    parametres.set("scope", "openid email profile");
    parametres.set("prompt", "select_account");
  } else {
    parametres.set("response_type", "code id_token");
    parametres.set("scope", "name email");
  }
  return `${ADRESSES[fournisseur]}?${parametres.toString()}`;
}
