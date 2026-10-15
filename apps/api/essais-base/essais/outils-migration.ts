// Essai des outils d'essayer-migration (socle/schema-base.ts, migrations-depot.ts, decouper-instructions.ts) sur la base
// en mémoire (toutes les migrations du dépôt) : le relevé voit un type rétréci (varchar(80) → varchar(40) : « modifie »,
// donc NON additive), un défaut ou un NOT NULL qui change, le corps d'une fonction ; il alerte pour une colonne NOT NULL sans
// défaut, une contrainte CHECK, UNIQUE ou de clé étrangère et un index UNIQUE ajoutés à une table qui existait (pas pour une
// table nouvelle, une contrainte NOT VALID ou un élargissement) ; sans position de PostgreSQL, le rejeu instruction par
// instruction nomme l'instruction fautive (sa ligne) et ne garde rien. Chaque migration d'essai est défaite (ROLLBACK).
import "../socle/garde-fou.ts";
import { readFileSync } from "node:fs";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { decouperInstructions } from "../socle/decouper-instructions.ts";
import { appliquerSql, decrireErreurPostgres, listerMigrations } from "../socle/migrations-depot.ts";
import { comparerSchemas, lireSchema, resumerAjouts, type Changements } from "../socle/schema-base.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { db } = essai;
const verifications = creerVerifications();
const { egal, vrai, correspond, rejette } = verifications;

/** Ce que la migration change, relevé avant et après, puis défait */
async function comparer(sql: string): Promise<Changements> {
  const avant = await lireSchema(db);
  await db.exec("BEGIN");
  try {
    await db.exec(sql);
    return comparerSchemas(avant, await lireSchema(db));
  } finally {
    await db.exec("ROLLBACK");
  }
}
const existe = async (table: string) => (await essai.sql(`SELECT count(*) AS n FROM pg_class WHERE relname = $1`, [table]))[0]!.n === "1";

// ── Le relevé : type, taille, nullité, défaut ──
const retrecie = await comparer(`ALTER TABLE "ambassadeurs" ALTER COLUMN "ville" TYPE VARCHAR(40)`);
egal(retrecie.modifications, ["colonne ambassadeurs.ville : character varying(80) NOT NULL → character varying(40) NOT NULL"], "varchar(80) → varchar(40) : modifie");
egal([retrecie.ajouts, retrecie.retraits], [[], []], "rien d'ajouté ni de retiré : NON additive par la seule modification");
egal(retrecie.risques, ["colonne ambassadeurs.ville : type character varying(80) → character varying(40) (échouera si une valeur existante n'y rentre pas ou ne s'y convertit pas)"]);
const elargie = await comparer(`ALTER TABLE "ambassadeurs" ALTER COLUMN "ville" TYPE VARCHAR(120); ALTER TABLE "ambassadeurs" ALTER COLUMN "quartier" TYPE TEXT`);
egal(elargie.modifications.length, 2, "élargie : modifie aussi");
egal(elargie.risques, [], "un élargissement ne casse aucune ligne");
const nullite = await comparer(`ALTER TABLE "avis" ALTER COLUMN "statut" SET DEFAULT 'en-relecture';
  ALTER TABLE "avis" ALTER COLUMN "texte" DROP NOT NULL; ALTER TABLE "avis" ALTER COLUMN "photo" SET NOT NULL`);
egal(nullite.modifications, [
  "colonne avis.photo : character varying(120) → character varying(120) NOT NULL",
  "colonne avis.statut : character varying(12) NOT NULL DEFAULT 'publie'::character varying → character varying(12) NOT NULL DEFAULT 'en-relecture'::character varying",
  "colonne avis.texte : character varying(1000) NOT NULL → character varying(1000)",
]);
egal(nullite.risques, ["colonne avis.photo : devient NOT NULL (échouera si une ligne y a NULL)"], "seul le NOT NULL posé est un risque");
const precise = await lireSchema(db);
egal([precise.get("colonne avis.note"), precise.get("colonne avis.cree_le")], ["smallint NOT NULL", "timestamp(0) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP"], "le type exact, avec sa précision");
const fonction = await comparer(readFileSync(listerMigrations().find((m) => m.nom.endsWith("_ajouter-activite-visites-fidelite"))!.fichier, "utf8")
  .match(/CREATE FUNCTION poser_publie_le[\s\S]*?\$\$ LANGUAGE plpgsql;/)![0].replace("CREATE FUNCTION", "CREATE OR REPLACE FUNCTION").replace("now()", "now() - interval '1 second'"));
egal(fonction.modifications, ["fonction poser_publie_le() : sa définition change"], "le corps d'une fonction qui change se voit");
egal(await comparer(`UPDATE "avis" SET "statut" = 'publie'`), { ajouts: [], retraits: [], modifications: [], risques: [] }, "des données seulement : rien");

// ── Les alertes : contraintes et index UNIQUE ajoutés à une table qui existait ──
const contraintes = await comparer(`ALTER TABLE "avis" ADD CONSTRAINT "avis_note_check" CHECK ("note" BETWEEN 1 AND 5);
  ALTER TABLE "ambassadeurs" ADD CONSTRAINT "ambassadeurs_ville_quartier_key" UNIQUE ("ville", "quartier");
  ALTER TABLE "avis" ADD CONSTRAINT "avis_reponse_par_essai_fkey" FOREIGN KEY ("reponse_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL;
  CREATE UNIQUE INDEX "avis_signature_key" ON "avis"("signature")`);
egal(contraintes.risques, [
  "contrainte ambassadeurs.ambassadeurs_ville_quartier_key : ajoutée : UNIQUE (ville, quartier)",
  "contrainte avis.avis_note_check : ajoutée : CHECK (((note >= 1) AND (note <= 5)))",
  "contrainte avis.avis_reponse_par_essai_fkey : ajoutée : FOREIGN KEY (reponse_par_id) REFERENCES comptes(id) ON DELETE SET NULL",
  "index avis.avis_signature_key : ajouté : UNIQUE (signature)",
], "CHECK, UNIQUE (une fois, sans son index), clé étrangère, index UNIQUE");
vrai(contraintes.ajouts.includes("index ambassadeurs.ambassadeurs_ville_quartier_key"), "l'index de la contrainte UNIQUE reste dans les ajouts");
egal([contraintes.retraits, contraintes.modifications], [[], []], "additive, mais signalée");
const sansRisque = await comparer(`CREATE TABLE "essais_rejeu" ("id" SERIAL NOT NULL, "avis_id" INTEGER NOT NULL, "code" VARCHAR(20) NOT NULL,
    CONSTRAINT "essais_rejeu_pkey" PRIMARY KEY ("id"), CONSTRAINT "essais_rejeu_code_check" CHECK (length("code") > 2));
  CREATE UNIQUE INDEX "essais_rejeu_code_key" ON "essais_rejeu"("code");
  ALTER TABLE "essais_rejeu" ADD CONSTRAINT "essais_rejeu_avis_id_fkey" FOREIGN KEY ("avis_id") REFERENCES "avis"("id") ON DELETE CASCADE;
  ALTER TABLE "avis" ADD COLUMN "humeur" VARCHAR(20), ADD COLUMN "lu" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "rang" INTEGER GENERATED ALWAYS AS IDENTITY;
  CREATE INDEX "avis_humeur_idx" ON "avis"("humeur");
  ALTER TABLE "avis" ADD CONSTRAINT "avis_humeur_check" CHECK ("humeur" <> '') NOT VALID`);
egal([sansRisque.risques, sansRisque.retraits, sansRisque.modifications], [[], [], []], "table nouvelle, défaut, identité, index simple, NOT VALID : aucun risque");
egal(resumerAjouts(sansRisque.ajouts), ["table(s) essais_rejeu (colonne : 3, index : 2, contrainte : 3)", "colonne avis.humeur", "colonne avis.lu",
  "colonne avis.rang", "contrainte avis.avis_humeur_check", "index avis.avis_humeur_idx"]);
egal((await comparer(`ALTER TABLE "avis" ADD COLUMN "humeur" VARCHAR(20) NOT NULL`)).risques,
  ["colonne avis.humeur : NOT NULL sans défaut (échouera si la table a des lignes)"]);

// ── Le rejeu : sans position, l'instruction fautive et sa ligne ; rien n'est gardé ──
const sansPosition = `-- Trois instructions, la troisième casse
CREATE TABLE "essais_rejeu" (
    "id" SERIAL NOT NULL,
    CONSTRAINT "essais_rejeu_pkey" PRIMARY KEY ("id")
);

-- Un « ; » dans un texte ne coupe pas : 'a;b'
COMMENT ON TABLE "essais_rejeu" IS 'a;b';

ALTER TABLE "comptes" ADD COLUMN "email" TEXT;

CREATE INDEX "essais_rejeu_idx" ON "essais_rejeu"("id");`;
await rejette(appliquerSql(db, sansPosition, "essai.sql"), /essai\.sql : column "email" of relation "comptes" already exists ; \(code 42701\) ; ligne 10 \(instruction 3 sur 4 : « ALTER TABLE "comptes" ADD COLUMN "email" TEXT »\)$/);
egal(await existe("essais_rejeu"), false, "rien de lui n'est gardé (ni le fichier, ni le rejeu)");
await rejette(appliquerSql(db, `CREATE TABLE "essais_rejeu" ("id" INTEGER);\nINSERT INTO "essais_rejeu" VALUES (1);\nALTER TABLE "essais_rejeu" ADD COLUMN "n" INTEGER NOT NULL;`, "e.sql"),
  /contains null values ; \(code 23502\) ; ligne 3 \(instruction 3 sur 3 : « ALTER TABLE "essais_rejeu" ADD COLUMN "n" INTEGER NOT NULL »\)$/, "NOT NULL sans défaut sur une table remplie");
await rejette(appliquerSql(db, `BEGIN;\nCREATE TABLE "essais_rejeu" ("id" INTEGER);\nCREATE TABLE "comptes" ("id" INTEGER);\nCOMMIT;`, "e.sql"),
  /relation "comptes" already exists ; \(code 42P07\) ; ligne 3 \(instruction 2 sur 2 :/, "BEGIN et COMMIT du fichier sautés au rejeu");
egal([await existe("essais_rejeu"), (await essai.sql("SELECT 1 AS un"))[0]!.un], [false, "1"], "la transaction du fichier, en échec, est défaite : la base répond");
// Un SAVEPOINT hors transaction casse le fichier d'un bloc, mais passe au rejeu (lui est dans une transaction)
await rejette(appliquerSql(db, `CREATE TABLE "essais_rejeu" ("id" INTEGER);\nSAVEPOINT avant_la_suite;`, "e.sql"),
  /\(code 25P01\) ; rejoué instruction par instruction, chacune passe : c'est le fichier d'un bloc qui casse$/);
egal(await existe("essais_rejeu"), false, "un rejeu qui passe en entier est défait aussi");
const avecPosition = `CREATE TABLE "essais_rejeu" ("id" SERIAL NOT NULL);\nALTER TABLE "essais_rejeu" ADD COLUM "code" TEXT;`;
await rejette(appliquerSql(db, avecPosition, "e.sql"), /syntax error at or near "TEXT" ; \(code 42601\) ; ligne 2, colonne 45$/, "avec une position : la ligne et la colonne, sans rejeu");
egal(decrireErreurPostgres({ message: "boum", code: "P0001", detail: "d", hint: "h", where: "PL/pgSQL" }, "", "ligne 4"),
  "boum ; (code P0001) ; ligne 4 ; détail : d ; piste : h ; contexte : PL/pgSQL");

// ── Le découpage : textes, noms, blocs $…$, commentaires imbriqués, E'…' ──
const morceaux = decouperInstructions(`-- tête ;\nCREATE TABLE a (x text DEFAULT ';');\n/* bloc ; /* imbriqué ; */ encore ; */ SELECT E'l\\'a;';
CREATE FUNCTION f() RETURNS int AS $corps$ SELECT 1; $corps$ LANGUAGE sql;\nSELECT "a;b", $1, date'2020;';\n-- fin ;\n`);
egal(morceaux.map((i) => [i.ligne, i.texte]), [[2, "CREATE TABLE a (x text DEFAULT ';')"], [3, "SELECT E'l\\'a;'"],
  [4, "CREATE FUNCTION f() RETURNS int AS $corps$ SELECT 1; $corps$ LANGUAGE sql"], [5, `SELECT "a;b", $1, date'2020;'`]]);
let total = 0;
for (const m of listerMigrations()) {
  const texte = readFileSync(m.fichier, "utf8");
  const instructions = decouperInstructions(texte);
  total += instructions.length;
  if (instructions.some((i) => texte.slice(i.debut, i.debut + i.texte.length) !== i.texte)) vrai(false, `${m.nom} : une instruction décalée`);
}
vrai(total > 300, `les ${listerMigrations().length} migrations du dépôt découpées (${total} instructions), chacune à sa place`);
await terminerEssai(import.meta.url, essai, verifications.nombre);
