-- CreateTable
CREATE TABLE "suggestions_lieux" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER,
    "source" VARCHAR(12) NOT NULL,
    "proposition" JSONB NOT NULL,
    "avant" JSONB NOT NULL,
    "message" VARCHAR(1000),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "champs_acceptes" TEXT[],
    "reponse" VARCHAR(1000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMPTZ(0),

    CONSTRAINT "suggestions_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suggestions_lieux_statut_cree_le_idx" ON "suggestions_lieux"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "suggestions_lieux_lieu_id_idx" ON "suggestions_lieux"("lieu_id");

-- AddForeignKey
ALTER TABLE "suggestions_lieux" ADD CONSTRAINT "suggestions_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions_lieux" ADD CONSTRAINT "suggestions_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
