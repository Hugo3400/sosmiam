// Garde-fou des essais sur base : à importer EN PREMIER (avant tout fichier de l'API). Les essais ne touchent qu'à une base
// PGlite en mémoire : rien ne doit pouvoir joindre la vraie base. Il refuse de se lancer si quelque chose pointe ailleurs
// (DATABASE_URL qui n'est pas l'adresse factice, variables PG*, SCHEMA_BASE, node lancé avec --env-file), puis ferme les
// portes une à une : aucun .env chargé (process.loadEnvFile coupé), ni prisma.config.ts ni dotenv importés, aucune
// connexion réseau (net.Socket), aucun client pg qui se connecte, et tout pool pg envoyé dans PGlite (pool-pglite.ts).
// Tout est synchrone : il a fini avant que le moindre autre module de l'essai ne s'exécute. Les processus (spawn, exec…) ne
// sont coupés qu'à la création de la base d'un essai (couperProcessusEnfants) : le lanceur, qui l'importe aussi, forke les essais.
import childProcess from "node:child_process";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import net from "node:net";
import pg from "pg";
import { remplacerPoolPg } from "./pool-pglite.ts";

/** L'adresse que voit l'API pendant les essais : le port 1 n'écoute jamais, et le pool pg ne s'en sert pas */
export const ADRESSE_FACTICE = "postgresql://essai:essai@127.0.0.1:1/essai";

const refuser = (pourquoi: string): never => {
  console.error(`Essais sur base refusés : ${pourquoi}`);
  process.exit(1);
};

const optionsNode = [...process.execArgv, ...(process.env.NODE_OPTIONS ?? "").split(/\s+/)];
if (optionsNode.some((o) => o.startsWith("--env-file"))) refuser("node est lancé avec --env-file, un .env serait chargé.");
// La valeur n'est jamais affichée : elle peut contenir un mot de passe
if (process.env.DATABASE_URL !== undefined && process.env.DATABASE_URL !== ADRESSE_FACTICE) {
  refuser("DATABASE_URL est défini et ne désigne pas la base factice des essais. Lance-les sans (la base est en mémoire).");
}
const variablesPg = Object.keys(process.env).filter((nom) => /^PG[A-Z_]+$/.test(nom));
if (variablesPg.length > 0) refuser(`${variablesPg.join(", ")} pointe vers un serveur PostgreSQL : lance les essais sans.`);
if (process.env.SCHEMA_BASE !== undefined) refuser("SCHEMA_BASE est défini : les essais n'utilisent que le schéma public de la base en mémoire.");
process.env.DATABASE_URL = ADRESSE_FACTICE;

process.loadEnvFile = () => {
  throw new Error("Garde-fou des essais : aucun .env n'est chargé pendant les essais.");
};

// Ni prisma.config.ts (il charge le .env), ni dotenv, ni un fichier .env importé
registerHooks({
  resolve(specifiant, contexte, suivant) {
    const resolu = suivant(specifiant, contexte);
    if (/\/prisma\.config\.[cm]?[jt]s$|\/node_modules\/dotenv\/|\/\.env(\.[^/]*)?$/.test(resolu.url)) {
      throw new Error(`Garde-fou des essais : ${resolu.url} n'est jamais chargé pendant les essais.`);
    }
    return resolu;
  },
});

// Aucune connexion réseau, TCP ou socket Unix (pg, et tout le reste, passent par là)
net.Socket.prototype.connect = function connexionRefusee(): never {
  throw new Error("Garde-fou des essais : aucune connexion réseau, la base est en mémoire (PGlite).");
};
pg.Client.prototype.connect = async function clientRefuse(): Promise<never> {
  throw new Error("Garde-fou des essais : aucun client pg ne se connecte, la base est en mémoire (PGlite).");
};
remplacerPoolPg();

const PROCESSUS = ["spawn", "exec", "execFile", "fork", "spawnSync", "execSync", "execFileSync"] as const;

/** Aucun processus lancé pendant un essai (psql, pg_dump, prisma migrate… parleraient à la vraie base) : spawn, exec,
 *  execFile, fork et leurs versions synchrones lèvent, imports nommés compris. Appelé par creerBaseEnMemoire et
 *  essayer-migration, jamais par le lanceur. */
export function couperProcessusEnfants(): void {
  for (const nom of PROCESSUS) {
    (childProcess as unknown as Record<string, unknown>)[nom] = function processusRefuse(): never {
      throw new Error(`Garde-fou des essais : aucun processus lancé (${nom}), la base est en mémoire (PGlite).`);
    };
  }
  // import { spawn } from "node:child_process" : les liaisons des modules déjà chargés suivent
  syncBuiltinESMExports();
}
