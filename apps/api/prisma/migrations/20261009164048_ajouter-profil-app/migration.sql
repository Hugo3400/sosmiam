-- AlterTable
ALTER TABLE "comptes" ADD COLUMN     "avatar" VARCHAR(16),
ADD COLUMN     "date_naissance_chiffree" VARCHAR(200),
ADD COLUMN     "envies" JSONB,
ADD COLUMN     "nom_chiffre" VARCHAR(200),
ADD COLUMN     "prive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pseudo" VARCHAR(20),
ADD COLUMN     "ville" VARCHAR(80);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_pseudo_key" ON "comptes"("pseudo");
