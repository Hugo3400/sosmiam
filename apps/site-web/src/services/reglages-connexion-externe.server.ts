// Réglages de « Continuer avec Apple » et « Continuer avec Google » sur le site. Lus dans l'environnement, complété une
// fois par le fichier apps/site-web/.env s'il existe (jamais commité ; les variables déjà posées gardent leur valeur).
// Aucun import « ~/… » ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.
import { chargerFichierEnv } from "../fonctions/env/charger-fichier-env.ts";
import type { FournisseurExterne } from "../types/connexion-externe.ts";

/** L'identifiant client OAuth « Web » de Google (public, comme tout client_id) ; SOS_MIAM_GOOGLE_CLIENT_ID_WEB le remplace,
 * et vide, il retire le bouton Google */
export const CLIENT_GOOGLE_WEB = "186162767871-47rgkc0b9bfrtc5jhc9csuee2kvu649e.apps.googleusercontent.com";
/** L'identifiant d'Expo Go : jamais utilisé comme client */
const CLIENT_INTERDIT = "host.exp.Exponent";

const nettoyer = (valeur: string | undefined) => {
  const propre = (valeur ?? "").trim();
  return /^[\w.-]{3,200}$/.test(propre) && propre !== CLIENT_INTERDIT ? propre : null;
};

/**
 * L'identifiant client de chaque fournisseur, ou null si son bouton ne doit pas s'afficher :
 * - Google : SOS_MIAM_GOOGLE_CLIENT_ID_WEB, sinon CLIENT_GOOGLE_WEB ;
 * - Apple : SOS_MIAM_APPLE_SERVICES_ID (le « Services ID », le même que dans apps/api/.env), sinon pas de bouton.
 */
export function lireReglagesConnexionExterne(): Record<FournisseurExterne, string | null> {
  chargerFichierEnv();
  return {
    google: nettoyer(process.env.SOS_MIAM_GOOGLE_CLIENT_ID_WEB ?? CLIENT_GOOGLE_WEB),
    apple: nettoyer(process.env.SOS_MIAM_APPLE_SERVICES_ID),
  };
}

/** Pour les pages : quels boutons montrer (jamais les identifiants eux-mêmes, inutiles dans la page) */
export function lireFournisseursActifs(): Record<FournisseurExterne, boolean> {
  const reglages = lireReglagesConnexionExterne();
  return { apple: reglages.apple !== null, google: reglages.google !== null };
}
