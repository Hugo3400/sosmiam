-- CreateTable
CREATE TABLE "stats_periodes" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(10) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "cle" VARCHAR(10) NOT NULL,
    "vues" INTEGER NOT NULL DEFAULT 0,
    "visites" INTEGER NOT NULL DEFAULT 0,
    "visiteurs" INTEGER NOT NULL DEFAULT 0,
    "esquisse" BYTEA,
    "secret" BYTEA,

    CONSTRAINT "stats_periodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stats_details" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(10) NOT NULL,
    "jour" VARCHAR(10) NOT NULL,
    "dimension" VARCHAR(12) NOT NULL,
    "valeur" VARCHAR(120) NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stats_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lieux" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(80) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "info" VARCHAR(60) NOT NULL,
    "texte" VARCHAR(1000) NOT NULL,
    "adresse" VARCHAR(160),
    "quartier" VARCHAR(60) NOT NULL,
    "ville" VARCHAR(80) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "prix" VARCHAR(3) NOT NULL,
    "prix_moyen" INTEGER,
    "couleurs" VARCHAR(9)[],
    "horaires" VARCHAR(160) NOT NULL,
    "ouverture" JSONB NOT NULL DEFAULT '[]',
    "plat" VARCHAR(80) NOT NULL,
    "tags" VARCHAR(40)[],
    "envies" VARCHAR(20)[],
    "reservable" BOOLEAN NOT NULL DEFAULT false,
    "telephone" VARCHAR(30),
    "site_web" VARCHAR(200),
    "instagram" VARCHAR(60),
    "decouvert_par" VARCHAR(40),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'brouillon',
    "note" VARCHAR(1000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "auteur_type" VARCHAR(10) NOT NULL,
    "auteur_pseudo" VARCHAR(40),
    "partenariat" VARCHAR(120),
    "legende" VARCHAR(500) NOT NULL,
    "illustration" BOOLEAN NOT NULL DEFAULT false,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'brouillon',
    "publiee_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medias_publications" (
    "id" SERIAL NOT NULL,
    "publication_id" INTEGER NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "fichier" VARCHAR(80) NOT NULL,
    "type_mime" VARCHAR(40) NOT NULL,
    "taille" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "medias_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signalements" (
    "id" SERIAL NOT NULL,
    "cible" VARCHAR(12) NOT NULL,
    "cible_id" VARCHAR(40) NOT NULL,
    "motif" VARCHAR(12) NOT NULL,
    "detail" VARCHAR(500),
    "source" VARCHAR(10) NOT NULL,
    "statut" VARCHAR(10) NOT NULL DEFAULT 'a-traiter',
    "decision" VARCHAR(500),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_le" TIMESTAMPTZ(0),

    CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brouillons_newsletter" (
    "id" SERIAL NOT NULL,
    "objet" VARCHAR(150) NOT NULL,
    "texte" VARCHAR(20000) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brouillons_newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_gestion" (
    "id" SERIAL NOT NULL,
    "moment" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poste" VARCHAR(40) NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "detail" VARCHAR(300),

    CONSTRAINT "journal_gestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stats_periodes_source_type_cle_key" ON "stats_periodes"("source", "type", "cle");

-- CreateIndex
CREATE INDEX "stats_details_source_dimension_jour_idx" ON "stats_details"("source", "dimension", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "stats_details_source_jour_dimension_valeur_key" ON "stats_details"("source", "jour", "dimension", "valeur");

-- CreateIndex
CREATE INDEX "lieux_statut_ville_idx" ON "lieux"("statut", "ville");

-- CreateIndex
CREATE INDEX "publications_statut_publiee_le_idx" ON "publications"("statut", "publiee_le");

-- CreateIndex
CREATE UNIQUE INDEX "medias_publications_fichier_key" ON "medias_publications"("fichier");

-- CreateIndex
CREATE INDEX "signalements_statut_cree_le_idx" ON "signalements"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "journal_gestion_moment_idx" ON "journal_gestion"("moment");

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medias_publications" ADD CONSTRAINT "medias_publications_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
