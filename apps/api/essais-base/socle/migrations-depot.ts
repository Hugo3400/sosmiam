// Les migrations du dépôt (apps/api/prisma/migrations), dans l'ordre où Prisma les applique (nom du dossier), et leur
// application dans une base PGlite, avec l'endroit du fichier où PostgreSQL s'arrête. Lecture seule : rien n'est jamais écrit
// dans prisma/.
import type { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { decouperInstructions } from "./decouper-instructions.ts";

export const DOSSIER_MIGRATIONS = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));

export type Migration = { nom: string; fichier: string };

export function listerMigrations(): Migration[] {
  return readdirSync(DOSSIER_MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
    .map((d) => d.name)
    .sort()
    .map((nom) => ({ nom, fichier: join(DOSSIER_MIGRATIONS, nom, "migration.sql") }));
}

type ErreurPostgres = { message?: string; code?: string; position?: string | number; detail?: string; hint?: string; where?: string };

/** Instructions de transaction du fichier, sautées au rejeu (un COMMIT validerait la transaction du rejeu) */
const CONTROLE_TRANSACTION = /^(BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK|ABORT)\b/i;

/** « ligne 4, colonne 9 » : là où PostgreSQL s'arrête, sa position comptée depuis `decalage` (null s'il n'en donne pas) */
function situer(erreur: ErreurPostgres, texte: string, decalage = 0): string | null {
  const position = Number(erreur.position);
  if (!Number.isInteger(position) || position <= 0) return null;
  const avant = texte.slice(0, decalage + position - 1).split("\n");
  return `ligne ${avant.length}, colonne ${avant.at(-1)!.length + 1}`;
}

/** Le message de PostgreSQL, son code, l'endroit du fichier où il s'arrête (sa position, ou `endroit` trouvé au rejeu) */
export function decrireErreurPostgres(erreur: unknown, texte: string, endroit?: string): string {
  const e = erreur as ErreurPostgres;
  const morceaux = [e.message ?? String(erreur)];
  if (e.code) morceaux.push(`(code ${e.code})`);
  const ou = situer(e, texte) ?? endroit;
  if (ou) morceaux.push(ou);
  if (e.detail) morceaux.push(`détail : ${e.detail}`);
  if (e.hint) morceaux.push(`piste : ${e.hint}`);
  if (e.where) morceaux.push(`contexte : ${e.where}`);
  return morceaux.join(" ; ");
}

/** Sans position (une erreur à l'exécution : « existe déjà », « contient des NULL »…) : le fichier rejoué instruction par
 *  instruction, dans une transaction, derrière un SAVEPOINT, puis tout défait (ROLLBACK) ; rend la ligne de la première
 *  instruction qui casse */
async function trouverInstructionFautive(db: PGlite, texte: string, erreur: ErreurPostgres): Promise<string> {
  const instructions = decouperInstructions(texte).filter((i) => !CONTROLE_TRANSACTION.test(i.texte));
  await db.exec("BEGIN; SAVEPOINT rejeu_instruction_par_instruction");
  try {
    for (const [rang, instruction] of instructions.entries()) {
      try {
        await db.exec(instruction.texte);
      } catch (casse) {
        const c = casse as ErreurPostgres;
        const ligne = instruction.texte.replace(/\s+/g, " ");
        const apercu = ligne.length > 90 ? `${ligne.slice(0, 89)}…` : ligne;
        const autre = c.message !== erreur.message ? ` ; à elle seule, PostgreSQL y dit : ${c.message}` : "";
        return `${situer(c, texte, instruction.debut) ?? `ligne ${instruction.ligne}`} (instruction ${rang + 1} sur ${instructions.length} : « ${apercu} »${autre})`;
      }
    }
    return `rejoué instruction par instruction, chacune passe : c'est le fichier d'un bloc qui casse`;
  } finally {
    await db.exec("ROLLBACK");
  }
}

/** Applique du SQL comme Prisma applique un fichier : d'un bloc (une erreur défait tout le fichier) ; lève avec le message de
 *  PostgreSQL et l'endroit du fichier (sa position, sinon la ligne de l'instruction fautive, trouvée au rejeu) */
export async function appliquerSql(db: PGlite, texte: string, nom: string): Promise<void> {
  try {
    await db.exec(texte);
  } catch (erreur) {
    // Un BEGIN du fichier laisse sa transaction ouverte et en échec : on la défait (sans transaction, ROLLBACK ne fait rien)
    await db.exec("ROLLBACK");
    const e = erreur as ErreurPostgres;
    const endroit = situer(e, texte) ? undefined : await trouverInstructionFautive(db, texte, e).catch(() => undefined);
    throw new Error(`${nom} : ${decrireErreurPostgres(erreur, texte, endroit)}`, { cause: erreur });
  }
}

export async function appliquerFichierSql(db: PGlite, fichier: string, nom: string): Promise<void> {
  await appliquerSql(db, readFileSync(fichier, "utf8"), nom);
}

export async function appliquerMigrations(db: PGlite, migrations: Migration[]): Promise<void> {
  for (const m of migrations) await appliquerFichierSql(db, m.fichier, m.nom);
}
