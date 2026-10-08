-- CreateTable
CREATE TABLE "demandes_lieux" (
    "id" SERIAL NOT NULL,
    "origine" VARCHAR(12) NOT NULL,
    "nom" VARCHAR(80) NOT NULL,
    "type" VARCHAR(20),
    "ville" VARCHAR(80) NOT NULL,
    "adresse" VARCHAR(160),
    "description" VARCHAR(1000) NOT NULL,
    "plat" VARCHAR(80),
    "horaires" VARCHAR(160),
    "site_web" VARCHAR(200),
    "instagram" VARCHAR(60),
    "contact_nom" VARCHAR(80),
    "contact_email" VARCHAR(254),
    "contact_telephone" VARCHAR(30),
    "lien_discord" VARCHAR(200),
    "statut" VARCHAR(10) NOT NULL DEFAULT 'a-traiter',
    "reponse" VARCHAR(1000),
    "lieu_id" INTEGER,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_le" TIMESTAMPTZ(0),

    CONSTRAINT "demandes_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_discord" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(100) NOT NULL,
    "texte" VARCHAR(3500) NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "lien_message" VARCHAR(200),
    "erreur" VARCHAR(300),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publiee_le" TIMESTAMPTZ(0),

    CONSTRAINT "annonces_discord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demandes_lieux_statut_cree_le_idx" ON "demandes_lieux"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "annonces_discord_statut_idx" ON "annonces_discord"("statut");
