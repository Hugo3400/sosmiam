-- CreateTable
CREATE TABLE "campagnes_newsletter" (
    "id" SERIAL NOT NULL,
    "brouillon_id" INTEGER,
    "objet" VARCHAR(150) NOT NULL,
    "html" TEXT NOT NULL,
    "texte" TEXT NOT NULL,
    "ville" VARCHAR(80),
    "total" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campagnes_newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envois_courriels" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "destinataire" VARCHAR(254) NOT NULL,
    "objet" VARCHAR(200),
    "html" TEXT,
    "texte" TEXT,
    "campagne_id" INTEGER,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "essais" INTEGER NOT NULL DEFAULT 0,
    "prochain_essai" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erreur" VARCHAR(300),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoye_le" TIMESTAMPTZ(0),

    CONSTRAINT "envois_courriels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "envois_courriels_statut_prochain_essai_idx" ON "envois_courriels"("statut", "prochain_essai");

-- CreateIndex
CREATE INDEX "envois_courriels_campagne_id_statut_idx" ON "envois_courriels"("campagne_id", "statut");

-- CreateIndex
CREATE INDEX "envois_courriels_type_destinataire_idx" ON "envois_courriels"("type", "destinataire");

-- CreateIndex
CREATE INDEX "envois_courriels_envoye_le_idx" ON "envois_courriels"("envoye_le");

-- AddForeignKey
ALTER TABLE "envois_courriels" ADD CONSTRAINT "envois_courriels_campagne_id_fkey" FOREIGN KEY ("campagne_id") REFERENCES "campagnes_newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
