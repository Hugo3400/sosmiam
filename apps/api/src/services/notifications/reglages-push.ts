// Réglages de l'envoi des notifications, déposés par Hugo lui-même dans /root/sos-miam-secrets (lisibles par root seul) :
// - Apple : push-apple.env (APNS_CLE_FICHIER, APNS_CLE_ID, APNS_EQUIPE_ID ; APNS_BUNDLE et APNS_ENVIRONNEMENT facultatifs)
//   et la clé « .p8 » créée sur developer.apple.com (Certificates, Identifiers & Profiles → Keys, avec APNs coché) ;
// - Google : push-google.json, la clé d'un compte de service du projet Firebase de l'app.
import { readFile, stat } from "node:fs/promises";

import { lireFichierReglages } from "../../fonctions/texte/lire-fichier-reglages.ts";

const DOSSIER = process.env.DOSSIER_SECRETS_PUSH || "/root/sos-miam-secrets";

export type ReglagesApple = { cle: string; cleId: string; equipeId: string; bundle: string; serveur: string };
export type ReglagesGoogle = { projet: string; email: string; cle: string };
export type EtatReglage = "pret" | "absent" | "mal-protege" | "incomplet";

/** Lit un fichier de secret, en refusant s'il est lisible par d'autres que root (null s'il manque). */
async function lireSecret(chemin: string): Promise<{ texte: string } | "absent" | "mal-protege"> {
  try {
    if ((await stat(chemin)).mode & 0o077) return "mal-protege";
    return { texte: await readFile(chemin, "utf8") };
  } catch {
    return "absent";
  }
}

export async function lireReglagesApple(): Promise<{ etat: EtatReglage; reglages: ReglagesApple | null }> {
  const fichier = await lireSecret(`${DOSSIER}/push-apple.env`);
  if (typeof fichier === "string") return { etat: fichier, reglages: null };
  const r = lireFichierReglages(fichier.texte);
  const chemin = (r.APNS_CLE_FICHIER ?? "").trim();
  if (!chemin || !r.APNS_CLE_ID?.trim() || !r.APNS_EQUIPE_ID?.trim()) return { etat: "incomplet", reglages: null };
  const cle = await lireSecret(chemin);
  if (typeof cle === "string") return { etat: cle === "absent" ? "incomplet" : cle, reglages: null };
  const developpement = (r.APNS_ENVIRONNEMENT ?? "").trim() === "developpement";
  return {
    etat: "pret",
    reglages: {
      cle: cle.texte,
      cleId: r.APNS_CLE_ID.trim(),
      equipeId: r.APNS_EQUIPE_ID.trim(),
      bundle: (r.APNS_BUNDLE || "fr.sosmiam.app").trim(),
      serveur: developpement ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com",
    },
  };
}

export async function lireReglagesGoogle(): Promise<{ etat: EtatReglage; reglages: ReglagesGoogle | null }> {
  const fichier = await lireSecret(`${DOSSIER}/push-google.json`);
  if (typeof fichier === "string") return { etat: fichier, reglages: null };
  try {
    const compte = JSON.parse(fichier.texte) as { project_id?: string; client_email?: string; private_key?: string };
    if (!compte.project_id || !compte.client_email || !compte.private_key) return { etat: "incomplet", reglages: null };
    return { etat: "pret", reglages: { projet: compte.project_id, email: compte.client_email, cle: compte.private_key } };
  } catch {
    return { etat: "incomplet", reglages: null };
  }
}
