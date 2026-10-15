// La base d'un essai : PGlite en mémoire (PostgreSQL compilé en WebAssembly, dans le processus), toutes les migrations du
// dépôt rejouées dans l'ordre, puis le vrai client Prisma branché dessus par l'adaptateur pg (pool-pglite.ts). Le client
// global de l'API (connexion.ts) y part aussi. Avant de rendre la main, on vérifie par une requête que les deux clients
// parlent bien à PGlite. Aucune vraie base, aucun réseau, aucun processus lancé (garde-fou.ts, importé ici pour les essais
// qui l'oublieraient).
import { couperProcessusEnfants } from "./garde-fou.ts";
import { PGlite, type Extensions } from "@electric-sql/pglite";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/base-de-donnees/client-genere/client.ts";
import { appliquerMigrations, listerMigrations } from "./migrations-depot.ts";
import { brancherPoolSur, type ModeTransactions } from "./pool-pglite.ts";

/** Les valeurs restent en texte (comme pg les reçoit) : les parseurs de l'adaptateur Prisma les lisent ensuite */
const TEXTE_BRUT: Record<number, (x: string) => string> = {};
for (let oid = 0; oid < 10000; oid++) TEXTE_BRUT[oid] = (x) => x;

export type BaseEnMemoire = {
  /** PGlite lui-même, pour préparer les données en SQL (résultats en texte : « t », « 1000 »…), hors de la file de Prisma */
  db: PGlite;
  /** Un client Prisma de l'essai, sur la même base */
  base: PrismaClient;
  /** Le client global de l'API (connexion.ts), sur la même base */
  baseDeDonnees: PrismaClient;
  /** Les migrations du dépôt rejouées */
  migrations: string[];
  /** Une requête SQL directe sur PGlite, ses lignes en texte */
  sql: (texte: string, valeurs?: unknown[]) => Promise<Record<string, unknown>[]>;
  fermer: () => Promise<void>;
};

async function verifierBrancheSurPGlite(client: PrismaClient, nom: string): Promise<void> {
  const [ligne] = await client.$queryRawUnsafe<{ v: string }[]>("SELECT version() AS v");
  if (!ligne?.v.includes("PGlite")) {
    console.error(`Essais sur base refusés : le ${nom} ne parle pas à PGlite.`);
    process.exit(1);
  }
}

/** transactions : « a-la-suite » (défaut) ou « melees », voir pool-pglite.ts */
export async function creerBaseEnMemoire(options: { extensions?: Extensions; transactions?: ModeTransactions } = {}): Promise<BaseEnMemoire> {
  couperProcessusEnfants();
  const db = new PGlite({ parsers: TEXTE_BRUT, extensions: options.extensions });
  const migrations = listerMigrations();
  await appliquerMigrations(db, migrations);
  // connexion.ts demande UTC à sa connexion (options) : le pool d'essai n'en a pas, c'est donc toute la base
  await db.exec("SET TIME ZONE 'UTC'");
  brancherPoolSur(db, options.transactions);
  const base = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({})) });
  const { baseDeDonnees } = await import("../../src/base-de-donnees/connexion.ts");
  await verifierBrancheSurPGlite(base, "client Prisma de l'essai");
  await verifierBrancheSurPGlite(baseDeDonnees, "client global de l'API (connexion.ts)");
  return {
    db,
    base,
    baseDeDonnees,
    migrations: migrations.map((m) => m.nom),
    sql: async (texte, valeurs = []) => (await db.query(texte, valeurs)).rows as Record<string, unknown>[],
    fermer: async () => {
      await base.$disconnect();
      await baseDeDonnees.$disconnect();
      brancherPoolSur(null);
      await db.close();
    },
  };
}
