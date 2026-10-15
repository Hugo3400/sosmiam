-- CreateTable
CREATE TABLE "limitations_comptes" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "motif" VARCHAR(12) NOT NULL,
    "motivation" VARCHAR(1000) NOT NULL,
    "debut" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMPTZ(0),
    "levee_le" TIMESTAMPTZ(0),
    "contestation" VARCHAR(1000),
    "conteste_le" TIMESTAMPTZ(0),
    "reexamine_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "limitations_comptes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "limitations_comptes_compte_id_levee_le_idx" ON "limitations_comptes"("compte_id", "levee_le");

-- CreateIndex
CREATE INDEX "limitations_comptes_fin_idx" ON "limitations_comptes"("fin");

-- AddForeignKey
ALTER TABLE "limitations_comptes" ADD CONSTRAINT "limitations_comptes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
