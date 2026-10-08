// Mises à jour du logiciel de gestion. Le module de mise à jour de Tauri ne sait pas signer ses demandes : le logiciel,
// connecté, obtient un jeton de 15 minutes (route signée), qu'il passe ensuite dans l'en-tête X-Jeton-Maj pour lire le
// manifeste (latest.json) et télécharger l'installateur. Les installateurs sont signés par la clé de mise à jour
// (vérifiée par le logiciel lui-même) : un fichier modifié serait refusé.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const DOSSIER_MAJ = process.env.DOSSIER_MAJ || "/var/lib/sos-miam/mises-a-jour";
const DUREE_JETON = 15 * 60_000;
// Secret des jetons : propre à ce lancement de l'API (un redémarrage invalide les jetons, sans gêne : 15 minutes)
const SECRET = randomBytes(32);
const NOM_INSTALLATEUR = /^SOS-Miam-Gestion-\d+\.\d+\.\d+-installateur\.exe$/;

const signer = (expiration: string) => createHmac("sha256", SECRET).update(`maj:${expiration}`).digest("base64url");

export function creerJetonMaj(maintenant = Date.now()): { jeton: string; expiration: string } {
  const expiration = String(maintenant + DUREE_JETON);
  return { jeton: `${expiration}.${signer(expiration)}`, expiration: new Date(Number(expiration)).toISOString() };
}

export function verifierJetonMaj(jeton: string, maintenant = Date.now()): boolean {
  const [expiration = "", signature = ""] = jeton.split(".");
  if (!/^\d{13}$/.test(expiration) || Number(expiration) < maintenant) return false;
  const attendue = Buffer.from(signer(expiration));
  const recue = Buffer.from(signature);
  return attendue.length === recue.length && timingSafeEqual(attendue, recue);
}

/** Le manifeste latest.json (écrit par scripts/construire-installateur.sh), ou null s'il n'y en a pas encore. */
export async function lireManifesteMaj(): Promise<string | null> {
  return readFile(join(DOSSIER_MAJ, "latest.json"), "utf8").catch(() => null);
}

/** Chemin d'un installateur publié (null si le nom n'en est pas un). */
export async function trouverInstallateur(nom: string): Promise<string | null> {
  if (!NOM_INSTALLATEUR.test(nom)) return null;
  const chemin = join(DOSSIER_MAJ, nom);
  return stat(chemin).then(() => chemin, () => null);
}
