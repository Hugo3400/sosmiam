// Essaie une migration hors ligne, avant de l'appliquer : rejoue les migrations du dépôt (apps/api/prisma/migrations, dans
// l'ordre) dans une base PGlite en mémoire, puis le fichier donné, et dit OK ou l'erreur de PostgreSQL (code de sortie 0 ou
// 1). Aucune vraie base (garde-fou), rien n'est écrit dans prisma/.
//   npm run api:essayer-migration -- <chemin du migration.sql>   (chemin relatif au dossier d'où tu lances npm)
// Un fichier hors du dépôt (le cas normal : une migration pas encore ajoutée) passe après toutes celles du dépôt. Un fichier
// du dépôt (prisma/migrations/<nom>/migration.sql) est rejoué À SA PLACE, jamais deux fois : celles d'avant, lui, puis celles
// d'après (elles doivent passer encore). On dit aussi ce qu'il ajoute, retire ou modifie (règle des migrations additives,
// docs/decisions.md : un type, une taille, un NOT NULL ou un défaut qui change est une modification) ; la base d'essai est
// vide : ce qui y passe mais échouera sur une table remplie est signalé (colonne NOT NULL sans défaut, contrainte CHECK,
// UNIQUE, clé étrangère ou index UNIQUE ajoutés à une table qui existait, type rétréci, NOT NULL posé). Quand PostgreSQL ne
// donne pas de position, l'instruction fautive est retrouvée en rejouant le fichier instruction par instruction (sa ligne).
import "./socle/garde-fou.ts";
import { PGlite } from "@electric-sql/pglite";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { appliquerFichierSql, appliquerMigrations, decrireValidationsPartielles, listerMigrations, trouverValidationsPartielles } from "./socle/migrations-depot.ts";
import { comparerSchemas, lireSchema, resumerAjouts } from "./socle/schema-base.ts";

const arreter = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const [demande, ...enTrop] = process.argv.slice(2);
if (demande === undefined || enTrop.length > 0) arreter("Usage : npm run api:essayer-migration -- <chemin du migration.sql>");
// npm lance le script depuis la racine du dépôt (puis apps/api) : le chemin se lit depuis le dossier où tu as tapé la commande
const depuis = process.env.INIT_CWD ?? process.cwd();
const chemin = resolve(depuis, demande!);
if (!existsSync(chemin) || !statSync(chemin).isFile()) arreter(`ERREUR : ${demande} n'est pas un fichier (lu depuis ${depuis}).`);
const fichier = realpathSync(chemin);
const affiche = relative(depuis, fichier).startsWith("..") ? fichier : relative(depuis, fichier);
const texte = readFileSync(fichier, "utf8");

const migrations = listerMigrations();
const place = migrations.findIndex((m) => existsSync(m.fichier) && realpathSync(m.fichier) === fichier);
const avant = place === -1 ? migrations : migrations.slice(0, place);
const apres = place === -1 ? [] : migrations.slice(place + 1);
const jumelle = place === -1 ? migrations.find((m) => existsSync(m.fichier) && readFileSync(m.fichier, "utf8") === texte) : undefined;
const validationsPartielles = trouverValidationsPartielles(texte);

const db = new PGlite();
const version = String(((await db.query("SELECT version() AS v")).rows[0] as { v: string }).v).replace(/ on wasm32.*$/, "");
try {
  await appliquerMigrations(db, avant);
} catch (erreur) {
  arreter(`ERREUR avant ton fichier : la chaîne du dépôt casse déjà, à ${(erreur as Error).message}`);
}
const schemaAvant = await lireSchema(db);
try {
  await appliquerFichierSql(db, fichier, affiche);
} catch (erreur) {
  const indice = jumelle ? `\n(Son contenu est celui de la migration du dépôt ${jumelle.nom}, déjà rejouée juste avant : elle est déjà dans la chaîne.)` : "";
  const garde = validationsPartielles.length > 0 ? "" : " (rien de lui n'est gardé)";
  arreter(`ERREUR : ${(erreur as Error).message}\nAprès ${avant.length} migration(s) du dépôt rejouée(s), ton fichier ne passe pas${garde}.${indice}`);
}
const schemaApres = await lireSchema(db);
const changements = comparerSchemas(schemaAvant, schemaApres, texte);
try {
  await appliquerMigrations(db, apres);
} catch (erreur) {
  arreter(`ERREUR après ton fichier : il passe, mais la migration suivante du dépôt casse ensuite, à ${(erreur as Error).message}`);
}
await db.close();

console.log(place === -1
  ? `OK : ${avant.length} migration(s) du dépôt rejouée(s) dans PGlite, puis ${affiche} : il passe.`
  : `OK : ${affiche} est la migration ${place + 1} sur ${migrations.length} du dépôt ; rejouée à sa place (${avant.length} avant, ${apres.length} après) : tout passe.`);
const liste = (lignes: string[]) => lignes.map((l) => `  - ${l}`).join("\n");
const ajouts = resumerAjouts(changements.ajouts);
if (ajouts.length > 0) console.log(`Ajoute :\n${liste(ajouts)}`);
if (changements.retraits.length + changements.modifications.length === 0) {
  console.log(ajouts.length > 0 ? "Additive : oui, elle ne retire et ne modifie rien." : "Elle ne change pas le schéma (données seulement, ou rien).");
} else {
  console.log(`Additive : NON.${changements.retraits.length > 0 ? `\nRetire :\n${liste(changements.retraits)}` : ""}`
    + `${changements.modifications.length > 0 ? `\nModifie :\n${liste(changements.modifications)}` : ""}`);
}
if (changements.risques.length > 0) {
  console.log(`Attention, sur une table qui existait : passe ici (base vide), échouera si les lignes existantes ne respectent pas :\n${liste(changements.risques)}`);
}
if (validationsPartielles.length > 0) {
  console.log(`Attention : ${decrireValidationsPartielles(validationsPartielles)}. Sur la vraie base, une instruction qui casse après lui y laisserait la migration à moitié appliquée : retire-le.`);
}
const installees = existsSync("/usr/lib/postgresql") ? readdirSync("/usr/lib/postgresql").join(", ") : null;
console.log(`(PGlite = ${version}${installees ? ` ; PostgreSQL installé sur cette machine : ${installees}` : ""} : une syntaxe plus récente que la vraie base passerait ici.)`);
