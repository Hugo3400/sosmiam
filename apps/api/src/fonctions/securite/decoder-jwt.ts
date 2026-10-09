/** Un jeton JWT découpé, PAS encore vérifié : en-tête et charge lus, contenu signé et signature à vérifier à part. */
export type JwtDecoupe = {
  entete: Record<string, unknown>;
  charge: Record<string, unknown>;
  /** « en-tête.charge » tel que reçu : c'est lui qui est signé */
  contenuSigne: string;
  signature: Buffer;
};

/** Plus long qu'un jeton d'Apple ou de Google (environ 1 000 caractères) : refusé sans rien lire */
const LONGUEUR_MAX = 8192;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

function lireObjet(partie: string): Record<string, unknown> | null {
  try {
    const valeur: unknown = JSON.parse(Buffer.from(partie, "base64url").toString("utf8"));
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur) ? (valeur as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Découpe un JWT compact (« en-tête.charge.signature », en base64url). Null s'il est mal formé, trop long, ou si l'en-tête
 * ou la charge ne sont pas des objets JSON. Rien n'est vérifié ici : la signature et les champs le sont par
 * lireIdentiteExterne (fonctions/comptes/lire-identite-externe.ts).
 */
export function decoderJwt(jeton: unknown): JwtDecoupe | null {
  if (typeof jeton !== "string" || jeton.length > LONGUEUR_MAX) return null;
  const parties = jeton.split(".");
  if (parties.length !== 3 || !parties.every((partie) => BASE64URL.test(partie))) return null;
  const [entetePartie, chargePartie, signaturePartie] = parties as [string, string, string];
  const entete = lireObjet(entetePartie);
  const charge = lireObjet(chargePartie);
  if (!entete || !charge) return null;
  return { entete, charge, contenuSigne: `${entetePartie}.${chargePartie}`, signature: Buffer.from(signaturePartie, "base64url") };
}
