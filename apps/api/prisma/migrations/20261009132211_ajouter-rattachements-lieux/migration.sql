-- CreateTable
CREATE TABLE "rattachements_lieux" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "preuve" VARCHAR(600) NOT NULL,
    "siret" VARCHAR(14),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "reponse" VARCHAR(1000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMPTZ(0),

    CONSTRAINT "rattachements_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rattachements_lieux_statut_cree_le_idx" ON "rattachements_lieux"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "rattachements_lieux_compte_id_idx" ON "rattachements_lieux"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "rattachements_lieux_lieu_id_compte_id_key" ON "rattachements_lieux"("lieu_id", "compte_id");

-- AddForeignKey
ALTER TABLE "rattachements_lieux" ADD CONSTRAINT "rattachements_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rattachements_lieux" ADD CONSTRAINT "rattachements_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
