// Les migrations du dépôt (apps/api/prisma/migrations), dans l'ordre où Prisma les applique (nom du dossier), et leur
// application dans une base PGlite. Lecture seule : rien n'est jamais écrit dans prisma/.
import type { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const DOSSIER_MIGRATIONS = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));

export type Migration = { nom: string; fichier: string };

export function listerMigrations(): Migration[] {
  return readdirSync(DOSSIER_MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
    .map((d) => d.name)
    .sort()
    .map((nom) => ({ nom, fichier: join(DOSSIER_MIGRATIONS, nom, "migration.sql") }));
}

/** Le message de PostgreSQL, son code et la ligne du fichier où il s'arrête (quand PostgreSQL la donne) */
export function decrireErreurPostgres(erreur: unknown, texte: string): string {
  const e = erreur as { message?: string; code?: string; position?: string | number; detail?: string; hint?: string };
  const morceaux = [e.message ?? String(erreur)];
  if (e.code) morceaux.push(`(code ${e.code})`);
  const position = Number(e.position);
  if (Number.isInteger(position) && position > 0) {
    const avant = texte.slice(0, position - 1).split("\n");
    morceaux.push(`ligne ${avant.length}, colonne ${avant.at(-1)!.length + 1}`);
  }
  if (e.detail) morceaux.push(`détail : ${e.detail}`);
  if (e.hint) morceaux.push(`piste : ${e.hint}`);
  return morceaux.join(" ; ");
}

/** Applique un fichier SQL comme Prisma : d'un bloc (une erreur défait tout le fichier) ; lève avec le message de PostgreSQL */
export async function appliquerFichierSql(db: PGlite, fichier: string, nom: string): Promise<void> {
  const texte = readFileSync(fichier, "utf8");
  try {
    await db.exec(texte);
  } catch (erreur) {
    throw new Error(`${nom} : ${decrireErreurPostgres(erreur, texte)}`, { cause: erreur });
  }
}

export async function appliquerMigrations(db: PGlite, migrations: Migration[]): Promise<void> {
  for (const m of migrations) await appliquerFichierSql(db, m.fichier, m.nom);
}
