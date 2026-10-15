-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "automatique" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creneaux_proposes" TIMESTAMPTZ(0)[] DEFAULT ARRAY[]::TIMESTAMPTZ(0)[];

-- CreateTable
CREATE TABLE "reglages_reservations" (
    "lieu_id" INTEGER NOT NULL,
    "services" JSONB NOT NULL DEFAULT '[]',
    "acceptation" VARCHAR(12) NOT NULL DEFAULT 'manuelle',
    "delai" VARCHAR(6) NOT NULL DEFAULT '1-h',
    "jours_fermes" VARCHAR(10)[] DEFAULT ARRAY[]::VARCHAR(10)[],
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglages_reservations_pkey" PRIMARY KEY ("lieu_id")
);

-- AddForeignKey
ALTER TABLE "reglages_reservations" ADD CONSTRAINT "reglages_reservations_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

