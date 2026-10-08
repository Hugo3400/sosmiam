// État du serveur pour le logiciel de gestion : API, base, disque, processus pm2 de SOS Miam.
import { execFile } from "node:child_process";
import { statfs } from "node:fs/promises";
import { promisify } from "node:util";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { lireEtatSauvegardes } from "./sauvegardes.ts";

const executer = promisify(execFile);
/** Processus que le logiciel peut relancer. Pas l'API elle-même : elle couperait la demande en cours. */
export const PROCESSUS_RELANCABLES = ["sos-miam-site", "sos-miam-bot-discord"];
const ADRESSE_SITE = process.env.ADRESSE_SITE ?? "http://127.0.0.1:5191";

async function lireProcessus() {
  try {
    const { stdout } = await executer("pm2", ["jlist"], { timeout: 10_000, maxBuffer: 8 * 1024 * 1024 });
    const liste = JSON.parse(stdout) as {
      name: string;
      pm2_env?: { status?: string; pm_uptime?: number; restart_time?: number };
      monit?: { memory?: number; cpu?: number };
    }[];
    return liste
      .filter((processus) => processus.name.startsWith("sos-miam"))
      .map((processus) => ({
        nom: processus.name,
        statut: processus.pm2_env?.status ?? "inconnu",
        depuis: processus.pm2_env?.pm_uptime ? new Date(processus.pm2_env.pm_uptime).toISOString() : null,
        relances: processus.pm2_env?.restart_time ?? 0,
        memoire: processus.monit?.memory ?? 0,
        processeur: processus.monit?.cpu ?? 0,
        relancable: PROCESSUS_RELANCABLES.includes(processus.name),
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  } catch {
    return null;
  }
}

async function lireBase() {
  const debut = performance.now();
  try {
    const [taille] = await baseDeDonnees.$queryRaw<{ octets: bigint }[]>`SELECT pg_database_size(current_database()) AS octets`;
    const tables = await baseDeDonnees.$queryRaw<{ table: string; lignes: bigint }[]>`
      SELECT relname AS "table", n_live_tup AS lignes FROM pg_stat_user_tables
      WHERE schemaname = ${process.env.SCHEMA_BASE || "public"} AND relname <> '_prisma_migrations' ORDER BY relname`;
    return {
      enLigne: true,
      delai: Math.round(performance.now() - debut),
      octets: Number(taille?.octets ?? 0),
      tables: tables.map((ligne) => ({ table: ligne.table, lignes: Number(ligne.lignes) })),
    };
  } catch {
    return { enLigne: false, delai: null, octets: 0, tables: [] };
  }
}

async function lireSite() {
  const debut = performance.now();
  try {
    const reponse = await fetch(`${ADRESSE_SITE}/mentions-legales`, { method: "HEAD", signal: AbortSignal.timeout(5000), headers: { "User-Agent": "sos-miam-gestion (verification)" } });
    return { enLigne: reponse.ok, statut: reponse.status, delai: Math.round(performance.now() - debut) };
  } catch {
    return { enLigne: false, statut: null, delai: null };
  }
}

export async function lireEtatServeur() {
  const [processus, base, site, disque, sauvegardes] = await Promise.all([
    lireProcessus(), lireBase(), lireSite(), statfs("/").catch(() => null), lireEtatSauvegardes(),
  ]);
  return {
    api: { depuis: new Date(Date.now() - process.uptime() * 1000).toISOString(), memoire: process.memoryUsage().rss, node: process.version },
    base,
    site,
    disque: disque ? { total: disque.blocks * disque.bsize, libre: disque.bavail * disque.bsize } : null,
    processus,
    sauvegardes: { cleExiste: sauvegardes.cleExiste, derniere: sauvegardes.sauvegardes[0] ?? null, nombre: sauvegardes.sauvegardes.length },
  };
}

export async function relancerProcessus(nom: string): Promise<boolean> {
  if (!PROCESSUS_RELANCABLES.includes(nom)) return false;
  await executer("pm2", ["restart", nom], { timeout: 30_000 });
  return true;
}
