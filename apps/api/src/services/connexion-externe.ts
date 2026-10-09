// « Se connecter avec Apple » et « Se connecter avec Google » (décidé le 9 octobre 2026) : vérification des jetons
// d'identité envoyés par l'app, avec les clés publiques d'Apple et de Google (cles-jwks.ts) et les règles de
// fonctions/comptes/lire-identite-externe.ts. Réglages lus au démarrage (demarrer.ts) : SOS_MIAM_APPLE_AUDIENCES et
// SOS_MIAM_GOOGLE_CLIENT_IDS. Contrat des adresses : routes/comptes.ts.
import { lireIdentiteExterne, type FournisseurExterne, type IdentiteExterne, type ReglesJetonExterne } from "../fonctions/comptes/lire-identite-externe.ts";
import { decoderJwt } from "../fonctions/securite/decoder-jwt.ts";
import { creerCacheCles, type ChercherCles } from "./cles-jwks.ts";

export const ADRESSE_CLES_APPLE = "https://appleid.apple.com/auth/keys";
export const ADRESSE_CLES_GOOGLE = "https://www.googleapis.com/oauth2/v3/certs";
export const EMETTEURS_APPLE = ["https://appleid.apple.com"];
export const EMETTEURS_GOOGLE = ["accounts.google.com", "https://accounts.google.com"];
/** L'App ID de l'app iOS : l'audience des jetons d'Apple par défaut */
export const AUDIENCES_APPLE_DEFAUT = ["fr.sosmiam.app"];

/**
 * Vérifie un jeton (et son nonce : brut, tel que l'app l'a gardé ; null pour Google sans nonce) : l'identité, ou null si
 * le jeton ne va pas. Lève ClesIndisponibles (cles-jwks.ts) si les clés publiques ne se chargent pas.
 */
export type VerifierJetonExterne = (jeton: unknown, nonce: string | null) => Promise<IdentiteExterne | null>;

type OptionsVerificateur = {
  /** Audiences acceptées : App ID (Apple), identifiants client OAuth iOS, Android et web (Google) */
  audiences: string[];
  /** Pour les tests : un faux fetch (jamais de réseau en test), une fausse horloge, une autre adresse */
  chercher?: ChercherCles;
  horloge?: () => number;
  adresseCles?: string;
};

function creerVerificateur(fournisseur: FournisseurExterne, options: OptionsVerificateur): VerifierJetonExterne {
  const { audiences, chercher, horloge = Date.now } = options;
  const apple = fournisseur === "apple";
  const cache = creerCacheCles({ adresse: options.adresseCles ?? (apple ? ADRESSE_CLES_APPLE : ADRESSE_CLES_GOOGLE), chercher, horloge });
  return async (jeton, nonce) => {
    const jwt = decoderJwt(jeton);
    if (!jwt || jwt.entete.alg !== "RS256") return null;
    // Apple : le nonce est obligatoire (la route le demande) ; Google : vérifié s'il est fourni
    if (apple && !nonce) return null;
    const regles: ReglesJetonExterne = {
      fournisseur, audiences, emetteurs: apple ? EMETTEURS_APPLE : EMETTEURS_GOOGLE, exigerEmailVerifie: !apple,
      nonce: nonce ? { valeur: nonce, forme: apple ? "empreinte" : "brut" } : null,
    };
    const resultat = lireIdentiteExterne(jwt, await cache.trouverCle(jwt.entete.kid), regles, horloge());
    return resultat.ok ? resultat.identite : null;
  };
}

/** Le vérificateur des jetons d'Apple (audiences : par défaut l'App ID fr.sosmiam.app) ; null sans audience. */
export function creerVerificateurApple(options: Partial<OptionsVerificateur> = {}): VerifierJetonExterne | null {
  const audiences = options.audiences ?? AUDIENCES_APPLE_DEFAUT;
  return audiences.length > 0 ? creerVerificateur("apple", { ...options, audiences }) : null;
}

/** Le vérificateur des jetons de Google ; null sans identifiant client (la route répond alors 503 « google-indisponible »). */
export function creerVerificateurGoogle(options: OptionsVerificateur): VerifierJetonExterne | null {
  return options.audiences.length > 0 ? creerVerificateur("google", options) : null;
}
