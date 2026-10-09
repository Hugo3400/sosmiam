-- AlterTable
ALTER TABLE "ambassadeurs" ADD COLUMN     "certifie_le" TIMESTAMPTZ(0),
ADD COLUMN     "profil_certifie" VARCHAR(12),
ADD COLUMN     "structure" VARCHAR(100);

-- CreateTable
CREATE TABLE "candidatures_certification" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "profil" VARCHAR(12) NOT NULL,
    "structure" VARCHAR(100),
    "commune_code" VARCHAR(5) NOT NULL,
    "aide" VARCHAR(600) NOT NULL,
    "envies" VARCHAR(80) NOT NULL,
    "engagement_gratuit" BOOLEAN NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),

    CONSTRAINT "candidatures_certification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidatures_certification_compte_id_idx" ON "candidatures_certification"("compte_id");

-- CreateIndex
CREATE INDEX "candidatures_certification_statut_cree_le_idx" ON "candidatures_certification"("statut", "cree_le");

-- AddForeignKey
ALTER TABLE "candidatures_certification" ADD CONSTRAINT "candidatures_certification_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
