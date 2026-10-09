-- AlterTable
ALTER TABLE "lieux" ADD COLUMN     "alerte" VARCHAR(80),
ADD COLUMN     "alerte_jusqua" TIMESTAMPTZ(0),
ADD COLUMN     "publie_le" TIMESTAMPTZ(0);

-- CreateTable
CREATE TABLE "rescousses" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "semaine" VARCHAR(8) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rescousses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premiers_sauveteurs" (
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premiers_sauveteurs_pkey" PRIMARY KEY ("lieu_id")
);

-- CreateTable
CREATE TABLE "lieux_gardes" (
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lieux_gardes_pkey" PRIMARY KEY ("compte_id","lieu_id")
);

-- CreateTable
CREATE TABLE "jaimes_publications" (
    "compte_id" INTEGER NOT NULL,
    "publication_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jaimes_publications_pkey" PRIMARY KEY ("compte_id","publication_id")
);

-- CreateTable
CREATE TABLE "publications_masquees" (
    "compte_id" INTEGER NOT NULL,
    "publication_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_masquees_pkey" PRIMARY KEY ("compte_id","publication_id")
);

-- CreateTable
CREATE TABLE "suivis_lieux" (
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suivis_lieux_pkey" PRIMARY KEY ("compte_id","lieu_id")
);

-- CreateTable
CREATE TABLE "suivis_createurs" (
    "compte_id" INTEGER NOT NULL,
    "pseudo" VARCHAR(40) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suivis_createurs_pkey" PRIMARY KEY ("compte_id","pseudo")
);

-- CreateTable
CREATE TABLE "programmes_fidelite" (
    "lieu_id" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "visites_requises" SMALLINT NOT NULL,
    "recompense" VARCHAR(60) NOT NULL,
    "alcool" BOOLEAN NOT NULL DEFAULT false,
    "recompense_sans_alcool" VARCHAR(60),
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programmes_fidelite_pkey" PRIMARY KEY ("lieu_id")
);

-- CreateTable
CREATE TABLE "cartes_fidelite" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "tampons" SMALLINT NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cartes_fidelite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recompenses_pretes" (
    "id" SERIAL NOT NULL,
    "carte_id" INTEGER NOT NULL,
    "libelle" VARCHAR(60) NOT NULL,
    "alcool" BOOLEAN NOT NULL DEFAULT false,
    "gagnee_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offerte_le" TIMESTAMPTZ(0),
    "offerte_par_id" INTEGER,

    CONSTRAINT "recompenses_pretes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demandes_recompenses" (
    "id" SERIAL NOT NULL,
    "carte_id" INTEGER NOT NULL,
    "recompense_id" INTEGER NOT NULL,
    "code" VARCHAR(4) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_le" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "demandes_recompenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_lieux" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER,
    "places" SMALLINT NOT NULL,
    "jusqua" TIMESTAMPTZ(0) NOT NULL,
    "offre" VARCHAR(80),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "arrete_le" TIMESTAMPTZ(0),

    CONSTRAINT "sos_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validations_lieux" (
    "lieu_id" INTEGER NOT NULL,
    "code_public" VARCHAR(8) NOT NULL,
    "validation_active" BOOLEAN NOT NULL DEFAULT false,
    "rayon_m" SMALLINT,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validations_lieux_pkey" PRIMARY KEY ("lieu_id")
);

-- CreateTable
CREATE TABLE "presentations_qr" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "montre_par_id" INTEGER,
    "personnes" SMALLINT NOT NULL,
    "restantes" SMALLINT NOT NULL,
    "reglement" JSONB,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_le" TIMESTAMPTZ(0) NOT NULL,
    "cachee_le" TIMESTAMPTZ(0),

    CONSTRAINT "presentations_qr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visites" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "mode" VARCHAR(12) NOT NULL,
    "statut" VARCHAR(10) NOT NULL,
    "code" VARCHAR(4),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_le" TIMESTAMPTZ(0),
    "valide_le" TIMESTAMPTZ(0),
    "decide_le" TIMESTAMPTZ(0),
    "decide_par_id" INTEGER,
    "pendant_sos" BOOLEAN NOT NULL DEFAULT false,
    "points" SMALLINT NOT NULL DEFAULT 0,
    "tampon" BOOLEAN NOT NULL DEFAULT false,
    "resultat_position" JSONB,
    "motif_refus" VARCHAR(12),
    "contestee" BOOLEAN NOT NULL DEFAULT false,
    "contestation" VARCHAR(500),
    "avis_ouvert_le" TIMESTAMPTZ(0),
    "avis_ferme_le" TIMESTAMPTZ(0),
    "avis_donne" BOOLEAN NOT NULL DEFAULT false,
    "presentation_id" INTEGER,
    "reservation_id" INTEGER,
    "annulable_jusqua" TIMESTAMPTZ(0),
    "reglement" JSONB,

    CONSTRAINT "visites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rescousses_lieu_id_idx" ON "rescousses"("lieu_id");

-- CreateIndex
CREATE INDEX "rescousses_compte_id_semaine_idx" ON "rescousses"("compte_id", "semaine");

-- CreateIndex
CREATE UNIQUE INDEX "rescousses_compte_id_lieu_id_semaine_key" ON "rescousses"("compte_id", "lieu_id", "semaine");

-- CreateIndex
CREATE INDEX "premiers_sauveteurs_compte_id_idx" ON "premiers_sauveteurs"("compte_id");

-- CreateIndex
CREATE INDEX "lieux_gardes_lieu_id_idx" ON "lieux_gardes"("lieu_id");

-- CreateIndex
CREATE INDEX "jaimes_publications_publication_id_idx" ON "jaimes_publications"("publication_id");

-- CreateIndex
CREATE INDEX "suivis_lieux_lieu_id_idx" ON "suivis_lieux"("lieu_id");

-- CreateIndex
CREATE INDEX "suivis_createurs_pseudo_idx" ON "suivis_createurs"("pseudo");

-- CreateIndex
CREATE INDEX "cartes_fidelite_lieu_id_idx" ON "cartes_fidelite"("lieu_id");

-- CreateIndex
CREATE UNIQUE INDEX "cartes_fidelite_compte_id_lieu_id_key" ON "cartes_fidelite"("compte_id", "lieu_id");

-- CreateIndex
CREATE INDEX "recompenses_pretes_carte_id_offerte_le_idx" ON "recompenses_pretes"("carte_id", "offerte_le");

-- CreateIndex
CREATE INDEX "demandes_recompenses_carte_id_expire_le_idx" ON "demandes_recompenses"("carte_id", "expire_le");

-- CreateIndex
CREATE INDEX "sos_lieux_lieu_id_jusqua_idx" ON "sos_lieux"("lieu_id", "jusqua");

-- CreateIndex
CREATE UNIQUE INDEX "validations_lieux_code_public_key" ON "validations_lieux"("code_public");

-- CreateIndex
CREATE INDEX "presentations_qr_lieu_id_expire_le_idx" ON "presentations_qr"("lieu_id", "expire_le");

-- CreateIndex
CREATE INDEX "visites_compte_id_cree_le_idx" ON "visites"("compte_id", "cree_le");

-- CreateIndex
CREATE INDEX "visites_lieu_id_statut_idx" ON "visites"("lieu_id", "statut");

-- CreateIndex
CREATE INDEX "visites_statut_expire_le_idx" ON "visites"("statut", "expire_le");

-- AddForeignKey
ALTER TABLE "rescousses" ADD CONSTRAINT "rescousses_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescousses" ADD CONSTRAINT "rescousses_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premiers_sauveteurs" ADD CONSTRAINT "premiers_sauveteurs_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premiers_sauveteurs" ADD CONSTRAINT "premiers_sauveteurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_gardes" ADD CONSTRAINT "lieux_gardes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_gardes" ADD CONSTRAINT "lieux_gardes_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_publications" ADD CONSTRAINT "jaimes_publications_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_publications" ADD CONSTRAINT "jaimes_publications_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications_masquees" ADD CONSTRAINT "publications_masquees_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications_masquees" ADD CONSTRAINT "publications_masquees_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivis_lieux" ADD CONSTRAINT "suivis_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivis_lieux" ADD CONSTRAINT "suivis_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivis_createurs" ADD CONSTRAINT "suivis_createurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes_fidelite" ADD CONSTRAINT "programmes_fidelite_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartes_fidelite" ADD CONSTRAINT "cartes_fidelite_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartes_fidelite" ADD CONSTRAINT "cartes_fidelite_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recompenses_pretes" ADD CONSTRAINT "recompenses_pretes_carte_id_fkey" FOREIGN KEY ("carte_id") REFERENCES "cartes_fidelite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recompenses_pretes" ADD CONSTRAINT "recompenses_pretes_offerte_par_id_fkey" FOREIGN KEY ("offerte_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_recompenses" ADD CONSTRAINT "demandes_recompenses_carte_id_fkey" FOREIGN KEY ("carte_id") REFERENCES "cartes_fidelite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_recompenses" ADD CONSTRAINT "demandes_recompenses_recompense_id_fkey" FOREIGN KEY ("recompense_id") REFERENCES "recompenses_pretes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_lieux" ADD CONSTRAINT "sos_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_lieux" ADD CONSTRAINT "sos_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validations_lieux" ADD CONSTRAINT "validations_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_qr" ADD CONSTRAINT "presentations_qr_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_qr" ADD CONSTRAINT "presentations_qr_montre_par_id_fkey" FOREIGN KEY ("montre_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_decide_par_id_fkey" FOREIGN KEY ("decide_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visites" ADD CONSTRAINT "visites_presentation_id_fkey" FOREIGN KEY ("presentation_id") REFERENCES "presentations_qr"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Première mise en ligne d'un lieu (badge « Nouveau » pendant 30 jours, premier sauveteur) : posée une seule fois, par la
-- base, quand il passe « publie », quel que soit l'endroit qui le publie (logiciel de gestion, import, demandes). Prisma
-- ne lit pas les déclencheurs : la prochaine comparaison de schéma ne propose pas de les supprimer.
CREATE FUNCTION poser_publie_le() RETURNS trigger AS $$
BEGIN
  IF NEW.statut = 'publie' AND NEW.publie_le IS NULL THEN
    NEW.publie_le := now();
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER lieux_poser_publie_le BEFORE INSERT OR UPDATE OF statut ON "lieux" FOR EACH ROW EXECUTE FUNCTION poser_publie_le();

-- Les lieux déjà publiés : leur date de création
UPDATE "lieux" SET "publie_le" = "cree_le" WHERE "statut" = 'publie' AND "publie_le" IS NULL;
