-- CreateTable
CREATE TABLE "big_sos" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "origine" VARCHAR(12) NOT NULL,
    "compte_id" INTEGER,
    "histoire" VARCHAR(3000) NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'demande',
    "mission_id" INTEGER,
    "objectif_titre" VARCHAR(100),
    "objectif_cible" INTEGER,
    "objectif_atteint" INTEGER NOT NULL DEFAULT 0,
    "liens" JSONB NOT NULL DEFAULT '[]',
    "debut_le" TIMESTAMPTZ(0),
    "fin_le" TIMESTAMPTZ(0),
    "bilan" VARCHAR(3000),
    "note" VARCHAR(2000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "big_sos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "big_sos_mission_id_key" ON "big_sos"("mission_id");

-- CreateIndex
CREATE INDEX "big_sos_statut_debut_le_idx" ON "big_sos"("statut", "debut_le");

-- CreateIndex
CREATE INDEX "big_sos_lieu_id_idx" ON "big_sos"("lieu_id");

-- AddForeignKey
ALTER TABLE "big_sos" ADD CONSTRAINT "big_sos_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "big_sos" ADD CONSTRAINT "big_sos_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "big_sos" ADD CONSTRAINT "big_sos_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions_ambassadeurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
