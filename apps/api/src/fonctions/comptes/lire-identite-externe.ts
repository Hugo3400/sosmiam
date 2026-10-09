// Vérification d'un jeton d'identité d'Apple ou de Google (OpenID Connect), sans réseau : la clé publique est déjà
// trouvée (services/cles-jwks.ts). Décidé le 9 octobre 2026 (docs/decisions.md, « L'app parle au serveur ») : le serveur
// vérifie lui-même les jetons. Jamais de jeton, d'e-mail ni de « sub » dans un journal.
import { timingSafeEqual, type JsonWebKey } from "node:crypto";

import { calculerEmpreinteNonce } from "../securite/calculer-empreinte-nonce.ts";
import type { JwtDecoupe } from "../securite/decoder-jwt.ts";
import { verifierSignatureRs256 } from "../securite/verifier-signature-rs256.ts";

/** Tolérance d'horloge entre le serveur et Apple ou Google, en secondes (60 au plus) */
export const TOLERANCE_HORLOGE = 60;

export type FournisseurExterne = "apple" | "google";

/** Ce que l'API garde d'un jeton vérifié */
export type IdentiteExterne = {
  fournisseur: FournisseurExterne;
  /** Identifiant stable du compte chez Apple ou Google (255 caractères au plus) */
  sub: string;
  /** E-mail du jeton en minuscules (une adresse « privaterelay » d'Apple est une vraie adresse), ou null s'il n'y en a pas */
  email: string | null;
  /** Apple : toujours vrai ; Google : email_verified */
  emailVerifie: boolean;
  /** Google seulement (portée « profile ») : prénom et nom, pour pré-remplir « Fais connaissance » ; jamais gardés tels quels */
  prenom: string | null;
  nom: string | null;
};

export type ReglesJetonExterne = {
  fournisseur: FournisseurExterne;
  /** Émetteurs acceptés (iss) */
  emetteurs: string[];
  /** Audiences acceptées (aud) : App ID d'Apple, identifiants client OAuth de Google */
  audiences: string[];
  /** Nonce attendu : « empreinte » (Apple : le jeton porte le SHA-256 hexadécimal du nonce brut) ou « brut » (Google) ;
   * null : pas de nonce à vérifier */
  nonce: { valeur: string; forme: "empreinte" | "brut" } | null;
  /** Google : e-mail vérifié exigé (email_verified vrai) ; Apple : l'e-mail compte toujours comme vérifié */
  exigerEmailVerifie: boolean;
};

export type RaisonRefus =
  | "algorithme" | "cle" | "signature" | "emetteur" | "audience" | "expire" | "emis-dans-le-futur" | "nonce" | "sub" | "email-non-verifie";

const egal = (a: string, b: string) => {
  const tamponA = Buffer.from(a);
  const tamponB = Buffer.from(b);
  return tamponA.length === tamponB.length && timingSafeEqual(tamponA, tamponB);
};
/** email_verified : un booléen chez Google, parfois le texte « true » (anciens jetons, et Apple) */
const estVrai = (valeur: unknown) => valeur === true || valeur === "true";
const lireTexte = (valeur: unknown, maximum: number) =>
  typeof valeur === "string" && valeur.trim() !== "" && valeur.length <= maximum ? valeur.trim() : null;

/**
 * Vérifie un jeton découpé (decoderJwt) avec la clé trouvée par son « kid » (null : inconnue) : algorithme RS256, signature,
 * émetteur, audience, exp et iat (à TOLERANCE_HORLOGE près), nonce, sub ; e-mail vérifié pour Google. `maintenant` en
 * millisecondes. Rend l'identité, ou la raison du refus (pour les tests ; l'API répond la même erreur dans tous les cas).
 */
export function lireIdentiteExterne(
  jwt: JwtDecoupe, cle: JsonWebKey | null, regles: ReglesJetonExterne, maintenant: number,
): { ok: true; identite: IdentiteExterne } | { ok: false; raison: RaisonRefus } {
  const refus = (raison: RaisonRefus) => ({ ok: false as const, raison });
  const { entete, charge } = jwt;
  if (entete.alg !== "RS256") return refus("algorithme");
  if (!cle) return refus("cle");
  if (!verifierSignatureRs256(jwt.contenuSigne, jwt.signature, cle)) return refus("signature");
  if (typeof charge.iss !== "string" || !regles.emetteurs.includes(charge.iss)) return refus("emetteur");
  const audiences = Array.isArray(charge.aud) ? charge.aud : [charge.aud];
  if (!audiences.some((audience) => typeof audience === "string" && regles.audiences.includes(audience))) return refus("audience");
  const secondes = maintenant / 1000;
  if (typeof charge.exp !== "number" || charge.exp + TOLERANCE_HORLOGE <= secondes) return refus("expire");
  if (typeof charge.iat !== "number" || charge.iat - TOLERANCE_HORLOGE > secondes) return refus("emis-dans-le-futur");
  if (regles.nonce) {
    const attendu = regles.nonce.forme === "empreinte" ? calculerEmpreinteNonce(regles.nonce.valeur) : regles.nonce.valeur;
    if (typeof charge.nonce !== "string" || !egal(charge.nonce, attendu)) return refus("nonce");
  }
  const sub = lireTexte(charge.sub, 255);
  if (!sub) return refus("sub");
  const email = lireTexte(charge.email, 254)?.toLowerCase() ?? null;
  const emailVerifie = regles.fournisseur === "apple" ? email !== null : email !== null && estVrai(charge.email_verified);
  if (regles.exigerEmailVerifie && !emailVerifie) return refus("email-non-verifie");
  return {
    ok: true,
    identite: {
      fournisseur: regles.fournisseur, sub, email, emailVerifie,
      prenom: regles.fournisseur === "google" ? lireTexte(charge.given_name, 40) : null,
      nom: regles.fournisseur === "google" ? lireTexte(charge.family_name, 60) : null,
    },
  };
}
