import "../socle/garde-fou.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { comparerMigration } from "../socle/comparer-migration.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { db } = essai;
const verifications = creerVerifications();
const { egal } = verifications;
const comparer = (sql: string) => comparerMigration(db, sql);
const SANS_RIEN = { ajouts: [], retraits: [], modifications: [], risques: [] };
const TYPE_RISQUE = "(échouera si une valeur existante n'y rentre pas ou ne s'y convertit pas)";

const surColonnesNulles = await comparer(`ALTER TABLE "avis" ADD COLUMN "parrain_id" INTEGER, ADD COLUMN "code" VARCHAR(20), ADD COLUMN "lot" INTEGER;
  ALTER TABLE "avis" ADD CONSTRAINT "avis_parrain_id_fkey" FOREIGN KEY ("parrain_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  CREATE UNIQUE INDEX "avis_code_key" ON "avis"("code");
  ALTER TABLE "avis" ADD CONSTRAINT "avis_lot_note_key" UNIQUE ("lot", "note");
  CREATE UNIQUE INDEX "avis_code_lot_key" ON "avis"(lower("code"), "lot") INCLUDE ("note")`);
egal(surColonnesNulles.risques, [], "clé étrangère et UNIQUE sur une colonne ajoutée sans valeur : les lignes existantes y ont NULL, rien à craindre");
egal(surColonnesNulles.modifications, [], "rien de modifié");

const parents = `CREATE TABLE "essais_parents" ("a" INTEGER, "b" SMALLINT, CONSTRAINT "essais_parents_a_b_key" UNIQUE ("a", "b"));
  ALTER TABLE "avis" ADD COLUMN "parrain_id" INTEGER`;
const pleine = await comparer(`${parents};
  ALTER TABLE "avis" ADD CONSTRAINT "avis_parrain_note_fkey" FOREIGN KEY ("parrain_id", "note") REFERENCES "essais_parents"("a", "b") MATCH FULL`);
egal(pleine.risques, ["contrainte avis.avis_parrain_note_fkey : ajoutée : FOREIGN KEY (parrain_id, note) REFERENCES essais_parents(a, b) MATCH FULL"],
  "MATCH FULL : une seule colonne nouvelle ne suffit pas, l'autre est vérifiée");
const simple = await comparer(`${parents};
  ALTER TABLE "avis" ADD CONSTRAINT "avis_parrain_note_fkey" FOREIGN KEY ("parrain_id", "note") REFERENCES "essais_parents"("a", "b")`);
egal(simple.risques, [], "MATCH SIMPLE : une colonne à NULL suffit, la ligne n'est pas vérifiée");

const toujoursSignale = await comparer(`ALTER TABLE "avis" ADD COLUMN "code" VARCHAR(20), ADD COLUMN "lot" INTEGER,
    ADD COLUMN "badge" VARCHAR(20) DEFAULT 'miam', ADD COLUMN "etiquette" VARCHAR(20) DEFAULT 'miam';
  ALTER TABLE "avis" ALTER COLUMN "etiquette" DROP DEFAULT;
  ALTER TABLE "avis" ADD CONSTRAINT "avis_code_check" CHECK ("code" IS NOT NULL);
  ALTER TABLE "avis" ADD CONSTRAINT "avis_lot_key" UNIQUE NULLS NOT DISTINCT ("lot");
  CREATE UNIQUE INDEX "avis_badge_key" ON "avis"("badge");
  CREATE UNIQUE INDEX "avis_etiquette_key" ON "avis"("etiquette")`);
egal(toujoursSignale.risques, [
  "contrainte avis.avis_code_check : ajoutée : CHECK ((code IS NOT NULL))",
  "contrainte avis.avis_lot_key : ajoutée : UNIQUE NULLS NOT DISTINCT (lot)",
  "index avis.avis_badge_key : ajouté : UNIQUE (badge)",
  "index avis.avis_etiquette_key : ajouté : UNIQUE (etiquette)",
], "CHECK, NULLS NOT DISTINCT, et une colonne remplie à l'ajout (défaut, même retiré ensuite) restent signalés");

const parDefautVolatil = await comparer(`ALTER TABLE "avis" ADD COLUMN "tirage" INTEGER DEFAULT floor(random() * 3);
  CREATE UNIQUE INDEX "avis_tirage_key" ON "avis"("tirage")`);
egal(parDefautVolatil.risques, ["index avis.avis_tirage_key : ajouté : UNIQUE (tirage)"], "un défaut volatil remplit les lignes à l'ajout : signalé");
const parUnUpdate = await comparer(`ALTER TABLE "avis" ADD COLUMN "code" VARCHAR(20);
  update avis set code = 'miam';
  CREATE UNIQUE INDEX "avis_code_key" ON "avis"("code")`);
egal(parUnUpdate.risques, ["index avis.avis_code_key : ajouté : UNIQUE (code)"], "une colonne nouvelle que le fichier remplit par UPDATE : signalée");
const parUneConversion = await comparer(`ALTER TABLE "avis" ADD COLUMN "copie" TEXT;
  ALTER TABLE ONLY public."avis" ALTER COLUMN "copie" TYPE INTEGER USING "id";
  ALTER TABLE "avis" ADD CONSTRAINT "avis_copie_fkey" FOREIGN KEY ("copie") REFERENCES "comptes"("id")`);
egal(parUneConversion.risques, ["contrainte avis.avis_copie_fkey : ajoutée : FOREIGN KEY (copie) REFERENCES comptes(id)"],
  "une colonne nouvelle que le fichier remplit par ALTER … USING : signalée");

await db.exec(`CREATE TABLE "essais_recree" ("id" INTEGER NOT NULL, "nom" TEXT, CONSTRAINT "essais_recree_pkey" PRIMARY KEY ("id"))`);
const tableRecreee = await comparer(`DROP TABLE "essais_recree";
  CREATE TABLE "essais_recree" ("id" INTEGER NOT NULL, "nom" TEXT, CONSTRAINT "essais_recree_pkey" PRIMARY KEY ("id"))`);
egal(tableRecreee, { ...SANS_RIEN, modifications: ["table essais_recree : effacée puis recréée : ses valeurs sont perdues"] }, "table recréée à l'identique : NON additive");
await db.exec(`DROP TABLE "essais_recree"`);
const colonneRecreee = await comparer(`ALTER TABLE "avis" DROP COLUMN "photo"; ALTER TABLE "avis" ADD COLUMN "photo" VARCHAR(120)`);
egal(colonneRecreee, { ...SANS_RIEN, modifications: ["colonne avis.photo : effacée puis recréée : ses valeurs sont perdues"] }, "colonne recréée à l'identique : NON additive");
const recreeeNonNulle = await comparer(`ALTER TABLE "avis" DROP COLUMN "photo"; ALTER TABLE "avis" ADD COLUMN "photo" VARCHAR(120) NOT NULL`);
egal(recreeeNonNulle.modifications, ["colonne avis.photo : effacée puis recréée (character varying(120) → character varying(120) NOT NULL) : ses valeurs sont perdues"]);
egal(recreeeNonNulle.risques, ["colonne avis.photo : NOT NULL sans défaut (échouera si la table a des lignes)"], "recréée NOT NULL sans défaut : comme une colonne nouvelle");
egal((await comparer(`ALTER TABLE "avis" ALTER COLUMN "texte" TYPE TEXT`)).modifications, ["colonne avis.texte : character varying(1000) NOT NULL → text NOT NULL"],
  "un changement de type réécrit la table sans recréer ses colonnes");

const entierRetreci = await comparer(`ALTER TABLE "avis" ALTER COLUMN "visite_id" TYPE SMALLINT`);
egal(entierRetreci.modifications, ["colonne avis.visite_id : integer → smallint"]);
egal(entierRetreci.risques, [`colonne avis.visite_id : type integer → smallint ${TYPE_RISQUE}`], "integer → smallint : rétréci");
const entierElargi = await comparer(`ALTER TABLE "avis" ALTER COLUMN "note" TYPE INTEGER; ALTER TABLE "avis" ALTER COLUMN "visite_id" TYPE BIGINT`);
egal(entierElargi.modifications, ["colonne avis.note : smallint NOT NULL → integer NOT NULL", "colonne avis.visite_id : integer → bigint"], "élargi : une modification");
egal(entierElargi.risques, [], "smallint → integer, integer → bigint : aucune valeur ne casse");
const texteEnEntier = await comparer(`ALTER TABLE "partages_position_miam_safe" ALTER COLUMN "position_chiffree" TYPE INTEGER USING length("position_chiffree")`);
egal(texteEnEntier.risques, [`colonne partages_position_miam_safe.position_chiffree : type text → integer ${TYPE_RISQUE}`], "text → integer USING : signalé");
await terminerEssai(import.meta.url, essai, verifications.nombre);
