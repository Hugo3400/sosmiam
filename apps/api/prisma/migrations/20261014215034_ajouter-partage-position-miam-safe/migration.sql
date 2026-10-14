
-- CreateTable
CREATE TABLE "partages_position_miam_safe" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "pote_id" INTEGER NOT NULL,
    "lieu_id" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "precision_m" INTEGER,
    "position_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_le" TIMESTAMPTZ(0) NOT NULL,
    "arrete_le" TIMESTAMPTZ(0),

    CONSTRAINT "partages_position_miam_safe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partages_position_miam_safe_compte_id_expire_le_idx" ON "partages_position_miam_safe"("compte_id", "expire_le");

-- CreateIndex
CREATE INDEX "partages_position_miam_safe_pote_id_expire_le_idx" ON "partages_position_miam_safe"("pote_id", "expire_le");

-- CreateIndex
CREATE INDEX "partages_position_miam_safe_expire_le_idx" ON "partages_position_miam_safe"("expire_le");

-- AddForeignKey
ALTER TABLE "partages_position_miam_safe" ADD CONSTRAINT "partages_position_miam_safe_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_position_miam_safe" ADD CONSTRAINT "partages_position_miam_safe_pote_id_fkey" FOREIGN KEY ("pote_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partages_position_miam_safe" ADD CONSTRAINT "partages_position_miam_safe_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

