import { timingSafeEqual } from "node:crypto";

import { verifierEmail } from "../texte/verifier-email.ts";
import { calculerSignatureDesinscription, OCTETS_SIGNATURE_DESINSCRIPTION } from "./calculer-signature-desinscription.ts";

/** Une adresse fait 254 caractères au plus : en base64url, 340 ; plus le point et la signature (22) */
const LONGUEUR_MAXIMUM = 400;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

/**
 * L'adresse d'un jeton de désinscription (creerJetonDesinscription), ou null s'il est mal formé ou que sa signature ne
 * correspond pas. La signature est comparée en temps constant ; seul l'encodage exact est accepté (pas de variante).
 */
export function lireJetonDesinscription(jeton: unknown, cle: Uint8Array): string | null {
  if (typeof jeton !== "string" || jeton.length > LONGUEUR_MAXIMUM) return null;
  const morceaux = jeton.split(".");
  if (morceaux.length !== 2) return null;
  const [partieEmail = "", partieSignature = ""] = morceaux;
  if (!BASE64URL.test(partieEmail) || !BASE64URL.test(partieSignature)) return null;

  const octetsEmail = Buffer.from(partieEmail, "base64url");
  const signature = Buffer.from(partieSignature, "base64url");
  if (octetsEmail.toString("base64url") !== partieEmail || signature.toString("base64url") !== partieSignature) return null;
  if (signature.length !== OCTETS_SIGNATURE_DESINSCRIPTION) return null;

  const email = octetsEmail.toString("utf8");
  if (Buffer.from(email, "utf8").toString("base64url") !== partieEmail) return null;
  const attendue = calculerSignatureDesinscription(email, cle);
  if (!timingSafeEqual(signature, attendue)) return null;
  // Signature juste : l'adresse vient bien de nous ; on vérifie quand même qu'elle a la forme attendue
  return email === email.trim().toLowerCase() && verifierEmail(email) ? email : null;
}
