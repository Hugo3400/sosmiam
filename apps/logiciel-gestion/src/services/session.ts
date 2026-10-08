// Session ouverte avec le code à 6 chiffres. Elle est aussi gardée sur ce PC, chiffrée par la clé tirée du mot de passe :
// en rouvrant le logiciel, le mot de passe suffit tant qu'elle est valable sur le serveur.
import { chiffrerTexte } from "~/fonctions/securite/chiffrer-texte.ts";
import { dechiffrerTexte } from "~/fonctions/securite/dechiffrer-texte.ts";
import { ecrireSessionLocale, lireSessionLocale, oublierSessionLocale } from "~/stockage/session-locale.ts";
import { appeler, definirSession, lireSession } from "./client-gestion.ts";

export type SessionOuverte = { session: string; poste: string; inactiviteMax: number };

/** Clé tirée du mot de passe, en mémoire seulement pendant que le logiciel est déverrouillé */
let cleCoffre: CryptoKey | null = null;

async function garderSurLePoste(session: string) {
  if (cleCoffre) ecrireSessionLocale(await chiffrerTexte(cleCoffre, session));
}

/** Retient (ou oublie, avec null) la clé tirée du mot de passe ; après un changement de mot de passe, rechiffre la session gardée. */
export async function definirCleCoffre(cle: CryptoKey | null): Promise<void> {
  cleCoffre = cle;
  const session = lireSession();
  if (cle && session && lireSessionLocale()) await garderSurLePoste(session);
}

/** Vrai si une session est gardée sur ce PC (le mot de passe pourrait suffire). */
export const aUneSessionGardee = () => lireSessionLocale() !== null;

/** Ouvre une session avec le code à 6 chiffres de l'application d'authentification, et la garde sur ce PC. */
export async function ouvrirSession(code: string): Promise<SessionOuverte> {
  const ouverte = await appeler<SessionOuverte>("POST", "/session", { corps: { code } });
  definirSession(ouverte.session);
  await garderSurLePoste(ouverte.session);
  return ouverte;
}

/** Reprend la session gardée sur ce PC (après le mot de passe) : le nom du poste si elle est encore valable, sinon null. */
export async function reprendreSessionGardee(): Promise<string | null> {
  const gardee = lireSessionLocale();
  if (!gardee || !cleCoffre) return null;
  try {
    definirSession(await dechiffrerTexte(cleCoffre, gardee));
  } catch {
    oublierSessionLocale();
    return null;
  }
  try {
    return (await appeler<{ poste: string }>("GET", "/session")).poste;
  } catch {
    definirSession(null);
    oublierSessionLocale();
    return null;
  }
}

/** Ferme la session pour de bon (cadenas du menu) : le code à 6 chiffres sera redemandé. */
export async function fermerSession(): Promise<void> {
  // Oubliée tout de suite (l'écran de connexion qui suit doit redemander le code), puis fermée sur le serveur
  const session = lireSession();
  definirSession(null);
  oublierSessionLocale();
  if (session) await appeler("DELETE", "/session", { session });
}
