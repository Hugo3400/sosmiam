// Essai du garde-fou lui-même (socle/garde-fou.ts), dans un vrai processus d'essai, forké par le lanceur (qui, lui, garde
// fork) : une fois la base en mémoire créée, aucun processus ne part (spawn, exec, execFile, fork et leurs versions
// synchrones, par l'objet du module, ses imports nommés, un import dynamique, require ou promisify), aucune connexion
// réseau ni client pg, aucun .env, ni prisma.config.ts ni dotenv ; DATABASE_URL est l'adresse factice, un pool pg et le
// client Prisma parlent à PGlite. Chaque porte lève avant d'agir : rien n'est lancé ni joint (au pire, « true » ou un
// fichier vide).
import "../socle/garde-fou.ts";
import childProcess, { exec, execFile, execFileSync, execSync, fork, spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import { promisify } from "node:util";
import pg from "pg";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { ADRESSE_FACTICE } from "../socle/garde-fou.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const verifications = creerVerifications();
const { egal, vrai, rejette } = verifications;
/** Le geste lève (tout de suite ou plus tard) avec le message du garde-fou */
const refuse = (geste: () => unknown, motif: RegExp, message: string) => rejette((async () => geste())(), motif, message);
const PROCESSUS = /Garde-fou des essais : aucun processus lancé \((spawn|exec|execFile|fork)(Sync)?\), la base est en mémoire \(PGlite\)\.$/;

egal(process.env.DATABASE_URL, ADRESSE_FACTICE, "DATABASE_URL : l'adresse factice (port 1)");
vrai(typeof process.send === "function", "lancé par le lanceur (canal IPC de fork) : lui forke toujours");

// Processus : imports nommés (liaisons suivies par syncBuiltinESMExports), objet du module, import dynamique, require, promisify
const nommes = { spawn, exec, execFile, fork, spawnSync, execSync, execFileSync };
for (const [nom, lancer] of Object.entries(nommes)) {
  await refuse(() => (nom === "fork" ? (lancer as typeof fork)("/dev/null") : (lancer as (c: string) => unknown)("true")), PROCESSUS, `import nommé ${nom}`);
}
for (const nom of Object.keys(nommes)) {
  await refuse(() => (childProcess as unknown as Record<string, (c: string) => unknown>)[nom]!("true"), new RegExp(`\\(${nom}\\)`), `child_process.${nom}`);
}
const dynamique = await import("node:child_process");
await refuse(() => dynamique.spawnSync("true"), PROCESSUS, "import dynamique");
const requis = createRequire(import.meta.url)("node:child_process") as typeof childProcess;
await refuse(() => requis.execSync("true"), PROCESSUS, "require (CommonJS)");
await refuse(() => promisify(exec)("true"), PROCESSUS, "promisify(exec)");

// Réseau et pg : aucune connexion
await refuse(() => net.connect(1, "127.0.0.1"), /Garde-fou des essais : aucune connexion réseau/, "net.connect");
await refuse(() => new net.Socket().connect({ path: "/var/run/postgresql/.s.PGSQL.5432" }), /Garde-fou des essais : aucune connexion réseau/, "socket Unix");
await refuse(() => new pg.Client({ connectionString: ADRESSE_FACTICE }).connect(), /Garde-fou des essais : aucun client pg/, "pg.Client");

// .env, prisma.config.ts, dotenv
await refuse(() => process.loadEnvFile(), /Garde-fou des essais : aucun \.env/, "process.loadEnvFile");
await refuse(() => import("../../prisma.config.ts"), /Garde-fou des essais : .*prisma\.config\.ts n'est jamais chargé/, "prisma.config.ts");
await refuse(() => import("dotenv"), /Garde-fou des essais : .*\/node_modules\/dotenv\/.* n'est jamais chargé/, "dotenv");

// Ce qui doit marcher marche encore : un pool pg (n'importe lequel) et le client Prisma vont dans PGlite
// (lignes en tableaux : le pool d'essai sert l'adaptateur Prisma, qui les lit ainsi)
const [[parPool]] = (await new pg.Pool({ connectionString: "postgresql://ailleurs:5432/vraie" }).query("SELECT version()")).rows as string[][];
vrai(parPool!.includes("PGlite"), "un pool pg, même avec une autre adresse, part dans PGlite");
egal(await essai.base.$queryRaw`SELECT 1 + 1 AS deux`, [{ deux: 2 }], "le client Prisma marche après la coupure des processus");
await terminerEssai(import.meta.url, essai, verifications.nombre);
