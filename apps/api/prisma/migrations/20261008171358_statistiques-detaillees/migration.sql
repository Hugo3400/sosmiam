-- AlterTable
ALTER TABLE "stats_periodes" ADD COLUMN     "duree_visites" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pages_mesurees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rebonds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "temps_total" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "visites_finies" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "reglages_gestion" (
    "cle" VARCHAR(40) NOT NULL,
    "valeur" JSONB NOT NULL,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglages_gestion_pkey" PRIMARY KEY ("cle")
);
