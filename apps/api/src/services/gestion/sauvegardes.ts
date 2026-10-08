// Sauvegardes de la base : pg_dump, chiffré à la volée (AES-256-GCM), rangé dans DOSSIER_SAUVEGARDES (root seul).
// La clé est créée au premier passage dans FICHIER_CLE_SAUVEGARDES (0600) ; Hugo la note dans son gestionnaire de mots
// de passe avec « npm run sauvegardes:cle » : sans elle, une sauvegarde ne se relit pas (scripts/restaurer-sauvegarde.ts).
// Format d'un fichier : « SOSMIAM-SAUVEGARDE-1\n », vecteur d'initialisation (12 octets), données chiffrées, étiquette (16 octets).
import { spawn } from "node:child_process";
import { createCipheriv, randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

export const DOSSIER_SAUVEGARDES = process.env.DOSSIER_SAUVEGARDES || "/var/backups/sos-miam";
export const FICHIER_CLE_SAUVEGARDES = process.env.FICHIER_CLE_SAUVEGARDES || "/root/sos-miam-secrets/cle-sauvegardes";
export const ENTETE_SAUVEGARDE = "SOSMIAM-SAUVEGARDE-1\n";
/** Sauvegardes gardées : les 30 plus récentes */
const NOMBRE_GARDE = 30;
const NOM_VALIDE = /^sosmiam-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.sauvegarde$/;

/** Clé de chiffrement des sauvegardes (32 octets), créée si elle n'existe pas encore. */
async function lireOuCreerCle(): Promise<Buffer> {
  try {
    const cle = Buffer.from((await readFile(FICHIER_CLE_SAUVEGARDES, "utf8")).trim(), "base64url");
    if (cle.length === 32) return cle;
    throw new Error(`${FICHIER_CLE_SAUVEGARDES} n'a pas la bonne forme`);
  } catch (erreur) {
    if ((erreur as NodeJS.ErrnoException).code !== "ENOENT") throw erreur;
    const cle = randomBytes(32);
    await mkdir(join(FICHIER_CLE_SAUVEGARDES, ".."), { recursive: true, mode: 0o700 });
    await writeFile(FICHIER_CLE_SAUVEGARDES, `${cle.toString("base64url")}\n`, { mode: 0o600, flag: "wx" });
    return cle;
  }
}

/** Réglages de connexion de pg_dump, passés par l'environnement (jamais dans la ligne de commande, visible par ps). */
function environnementPostgres(): NodeJS.ProcessEnv {
  const adresse = new URL(process.env.DATABASE_URL ?? "");
  return {
    PATH: process.env.PATH,
    PGHOST: adresse.hostname,
    PGPORT: adresse.port || "5432",
    PGUSER: decodeURIComponent(adresse.username),
    PGPASSWORD: decodeURIComponent(adresse.password),
    PGDATABASE: adresse.pathname.slice(1),
  };
}

export type Sauvegarde = { nom: string; taille: number; creeLe: string };

/** Fait une sauvegarde chiffrée maintenant, puis ne garde que les plus récentes. */
export async function sauvegarderBase(): Promise<Sauvegarde> {
  const cle = await lireOuCreerCle();
  await mkdir(DOSSIER_SAUVEGARDES, { recursive: true, mode: 0o700 });
  const moment = new Date();
  const nom = `sosmiam-${moment.toISOString().slice(0, 19).replace(/:/g, "-")}.sauvegarde`;
  const temporaire = join(DOSSIER_SAUVEGARDES, `.${nom}.en-cours`);
  const iv = randomBytes(12);
  const chiffrement = createCipheriv("aes-256-gcm", cle, iv);
  const schema = process.env.SCHEMA_BASE ? [`--schema=${process.env.SCHEMA_BASE}`] : [];
  const sauvegarde = spawn("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", ...schema], { env: environnementPostgres() });
  let erreurs = "";
  sauvegarde.stderr.on("data", (morceau: Buffer) => {
    erreurs = (erreurs + morceau.toString()).slice(-2000);
  });
  const fin = new Promise<void>((resoudre, rejeter) => {
    sauvegarde.on("error", rejeter);
    sauvegarde.on("close", (code) => (code === 0 ? resoudre() : rejeter(new Error(`pg_dump a échoué (${code}) : ${erreurs.trim()}`))));
  });
  try {
    const sortie = createWriteStream(temporaire, { mode: 0o600 });
    sortie.write(Buffer.concat([Buffer.from(ENTETE_SAUVEGARDE), iv]));
    const etiquette = new Transform({
      transform(morceau, _codage, suite) {
        suite(null, morceau);
      },
      flush(suite) {
        suite(null, chiffrement.getAuthTag());
      },
    });
    await Promise.all([pipeline(sauvegarde.stdout, chiffrement, etiquette, sortie), fin]);
    await rename(temporaire, join(DOSSIER_SAUVEGARDES, nom));
  } catch (erreur) {
    await rm(temporaire, { force: true });
    throw erreur;
  }
  const anciennes = (await listerSauvegardes()).slice(NOMBRE_GARDE);
  await Promise.all(anciennes.map((ancienne) => rm(join(DOSSIER_SAUVEGARDES, ancienne.nom), { force: true })));
  const infos = await stat(join(DOSSIER_SAUVEGARDES, nom));
  return { nom, taille: infos.size, creeLe: moment.toISOString() };
}

/** Sauvegardes présentes, de la plus récente à la plus ancienne. */
export async function listerSauvegardes(): Promise<Sauvegarde[]> {
  let noms: string[];
  try {
    noms = (await readdir(DOSSIER_SAUVEGARDES)).filter((nom) => NOM_VALIDE.test(nom));
  } catch {
    return [];
  }
  const sauvegardes = await Promise.all(
    noms.map(async (nom) => {
      const infos = await stat(join(DOSSIER_SAUVEGARDES, nom));
      return { nom, taille: infos.size, creeLe: infos.mtime.toISOString() };
    }),
  );
  return sauvegardes.sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

/** Où en sont les sauvegardes : la liste, et si la clé existe. */
export async function lireEtatSauvegardes() {
  const cleExiste = await stat(FICHIER_CLE_SAUVEGARDES).then(() => true, () => false);
  return { dossier: DOSSIER_SAUVEGARDES, cleExiste, sauvegardes: await listerSauvegardes() };
}

/** Chemin d'une sauvegarde existante (null si le nom n'en est pas une : on ne sert jamais un nom inventé). */
export async function trouverSauvegarde(nom: string): Promise<string | null> {
  if (!NOM_VALIDE.test(nom)) return null;
  const chemin = join(DOSSIER_SAUVEGARDES, nom);
  return stat(chemin).then(() => chemin, () => null);
}
