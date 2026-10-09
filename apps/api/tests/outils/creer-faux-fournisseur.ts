// Faux Apple et faux Google pour les tests : de VRAIES clés RSA générées ici (jamais celles d'Apple ou de Google), des
// jetons signés comme les leurs, et un faux fetch qui sert les clés publiques (JWKS). Aucun appel réseau.
import { generateKeyPairSync, sign, type JsonWebKey, type KeyObject } from "node:crypto";

import { calculerEmpreinteNonce } from "../../src/fonctions/securite/calculer-empreinte-nonce.ts";
import type { ChercherCles } from "../../src/services/cles-jwks.ts";

const base64url = (texte: string) => Buffer.from(texte).toString("base64url");

/** Une paire de clés RSA de test et sa clé publique en JWK (avec son « kid ») */
export function creerCleTest(kid: string, bits = 2048): { privee: KeyObject; jwk: JsonWebKey & { kid: string } } {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: bits });
  return { privee: privateKey, jwk: { ...publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" } };
}

/** Un JWT signé RS256 (ou avec un autre `alg` écrit dans l'en-tête, pour les refus) */
export function signerJeton(charge: Record<string, unknown>, cle: { privee: KeyObject; jwk: { kid: string } }, entete: Record<string, unknown> = {}): string {
  const contenu = `${base64url(JSON.stringify({ alg: "RS256", kid: cle.jwk.kid, typ: "JWT", ...entete }))}.${base64url(JSON.stringify(charge))}`;
  return `${contenu}.${sign("sha256", Buffer.from(contenu), cle.privee).toString("base64url")}`;
}

/**
 * Un faux fournisseur : ses clés publiques servies par `chercher` (appels comptés, panne réglable, Cache-Control réglable),
 * et des jetons d'Apple ou de Google valables à `maintenant()` (à retoucher avec `retouches`).
 */
export function creerFauxFournisseur(fournisseur: "apple" | "google", maintenant: () => number) {
  const cle = creerCleTest(`${fournisseur}-1`);
  const etat = { cles: [cle.jwk] as JsonWebKey[], appels: 0, panne: false, cacheControl: "public, max-age=3600" as string | null };
  const chercher: ChercherCles = async () => {
    etat.appels += 1;
    if (etat.panne) throw new TypeError("fetch failed");
    return {
      ok: true, status: 200, headers: { get: (nom) => (nom.toLowerCase() === "cache-control" ? etat.cacheControl : null) },
      json: async () => ({ keys: etat.cles }),
    };
  };
  /** Jeton pour ce compte (sub), avec ce nonce BRUT (Apple : son empreinte dans le jeton) */
  function jeton(sub: string, email: string | null, nonce: string | null, retouches: Record<string, unknown> = {}) {
    const secondes = Math.floor(maintenant() / 1000);
    const commun = { sub, iat: secondes, exp: secondes + 600, ...(email ? { email } : {}) };
    const charge = fournisseur === "apple"
      ? { iss: "https://appleid.apple.com", aud: "fr.sosmiam.app", email_verified: "true", ...(nonce ? { nonce: calculerEmpreinteNonce(nonce) } : {}), ...commun }
      : { iss: "https://accounts.google.com", aud: "client-ios.apps.googleusercontent.com", email_verified: true, given_name: "Zoé", family_name: "Martin",
          ...(nonce ? { nonce } : {}), ...commun };
    return signerJeton({ ...charge, ...retouches }, cle);
  }
  return { cle, etat, chercher, jeton };
}
