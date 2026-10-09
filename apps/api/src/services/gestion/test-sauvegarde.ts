// Test d'une sauvegarde (bouton du logiciel, Maintenance) : la déchiffrer (l'étiquette AES-GCM prouve qu'elle n'est pas
// abîmée), la faire relire en entier par pg_restore (toutes les tables, toutes les données), et compter les lignes de
// chaque table, face à la base d'aujourd'hui. Rien n'est restauré ni écrit, sauf le résultat du dernier test.
import { spawn } from "node:child_process";
import { createDecipheriv } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, readFile, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { ENTETE_SAUVEGARDE, FICHIER_CLE_SAUVEGARDES, listerSauvegardes, trouverSauvegarde } from "./sauvegardes.ts";

const CLE_REGLAGE = "test-sauvegarde";
const TAILLE_IV = 12;
const TAILLE_ETIQUETTE = 16;
const NOM_TABLE = /^[a-z_][a-z0-9_]*$/;
/** Schéma de la base (celui d'essai pendant les tests, comme base-de-donnees/connexion.ts) */
const SCHEMA = process.env.SCHEMA_BASE && NOM_TABLE.test(process.env.SCHEMA_BASE) ? process.env.SCHEMA_BASE : "public";

export type ResultatTestSauvegarde = {
  nom: string; testeLe: string; ok: boolean; erreur: string | null; dureeMs: number; taille: number;
  tables: { table: string; lignes: number; aujourdhui: number | null }[];
};

/** Lignes de chaque table dans le SQL que rend pg_restore : entre « COPY schéma.table (…) FROM stdin; » et « \. » */
async function compterLignes(sql: NodeJS.ReadableStream): Promise<Map<string, number>> {
  const lignes = new Map<string, number>();
  let table: string | null = null;
  for await (const ligne of createInterface({ input: sql, crlfDelay: Infinity })) {
    if (table) {
      if (ligne === "\\.") table = null;
      else lignes.set(table, (lignes.get(table) ?? 0) + 1);
      continue;
    }
    const copie = /^COPY [a-z_0-9"]+\.("?)([a-z_0-9]+)\1 .*FROM stdin;$/.exec(ligne);
    if (copie) {
      table = copie[2]!;
      lignes.set(table, lignes.get(table) ?? 0);
    }
  }
  return lignes;
}

/** Teste une sauvegarde (la plus récente si aucun nom n'est donné) et garde le résultat. */
export async function testerSauvegarde(nom?: string): Promise<ResultatTestSauvegarde | null> {
  const choisie = nom ?? (await listerSauvegardes())[0]?.nom;
  const chemin = choisie ? await trouverSauvegarde(choisie) : null;
  if (!choisie || !chemin) return null;
  const debut = Date.now();
  const taille = (await stat(chemin)).size;
  const resultat: ResultatTestSauvegarde = { nom: choisie, testeLe: new Date().toISOString(), ok: false, erreur: null, dureeMs: 0, taille, tables: [] };
  try {
    const cle = Buffer.from((await readFile(FICHIER_CLE_SAUVEGARDES, "utf8")).trim(), "base64url");
    const entete = Buffer.byteLength(ENTETE_SAUVEGARDE);
    const fichier = await open(chemin, "r");
    const debutFichier = Buffer.alloc(entete + TAILLE_IV);
    const etiquette = Buffer.alloc(TAILLE_ETIQUETTE);
    await fichier.read(debutFichier, 0, debutFichier.length, 0);
    await fichier.read(etiquette, 0, TAILLE_ETIQUETTE, taille - TAILLE_ETIQUETTE);
    await fichier.close();
    if (debutFichier.subarray(0, entete).toString() !== ENTETE_SAUVEGARDE) throw new Error("ce fichier n'est pas une sauvegarde SOS Miam");
    const dechiffrement = createDecipheriv("aes-256-gcm", cle, debutFichier.subarray(entete));
    dechiffrement.setAuthTag(etiquette);
    const relecture = spawn("pg_restore", ["--file=-"], { env: { PATH: process.env.PATH } });
    let erreurs = "";
    relecture.stderr.on("data", (morceau: Buffer) => (erreurs = (erreurs + morceau.toString()).slice(-2000)));
    const fin = new Promise<number>((resoudre) => relecture.on("close", (code) => resoudre(code ?? 1)));
    const [lignes] = await Promise.all([
      compterLignes(relecture.stdout),
      pipeline(createReadStream(chemin, { start: entete + TAILLE_IV, end: taille - TAILLE_ETIQUETTE - 1 }), dechiffrement, relecture.stdin),
    ]);
    if ((await fin) !== 0) throw new Error(`pg_restore n'a pas pu tout relire : ${erreurs.trim().slice(0, 300)}`);
    const tables = [...lignes.entries()].filter(([table]) => NOM_TABLE.test(table));
    const aujourdhui = await Promise.all(tables.map(async ([table]) => {
      const [ligne] = await baseDeDonnees.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "${SCHEMA}"."${table}"`).catch(() => [undefined]);
      return ligne ? Number(ligne.n) : null;
    }));
    resultat.tables = tables.map(([table, n], i) => ({ table, lignes: n, aujourdhui: aujourdhui[i] ?? null })).sort((a, b) => b.lignes - a.lignes || a.table.localeCompare(b.table));
    resultat.ok = tables.length > 0;
    if (!resultat.ok) resultat.erreur = "aucune table relue";
  } catch (erreur) {
    // « Unsupported state or unable to authenticate data » : mauvaise clé, ou fichier abîmé
    const message = (erreur as Error).message ?? String(erreur);
    resultat.erreur = /authenticate/i.test(message) ? "déchiffrement refusé : fichier abîmé ou clé différente" : message.slice(0, 300);
  }
  resultat.dureeMs = Date.now() - debut;
  const valeur = resultat as unknown as Prisma.InputJsonValue;
  await baseDeDonnees.reglageGestion.upsert({ where: { cle: CLE_REGLAGE }, create: { cle: CLE_REGLAGE, valeur }, update: { valeur } });
  return resultat;
}

/** Le dernier test fait (bouton ou nuit), ou null s'il n'y en a jamais eu. */
export async function lireDernierTestSauvegarde(): Promise<ResultatTestSauvegarde | null> {
  const reglage = await baseDeDonnees.reglageGestion.findUnique({ where: { cle: CLE_REGLAGE } });
  return (reglage?.valeur as ResultatTestSauvegarde | undefined) ?? null;
}
