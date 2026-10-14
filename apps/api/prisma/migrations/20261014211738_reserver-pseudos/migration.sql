-- CreateTable
CREATE TABLE "pseudos_reserves" (
    "id" SERIAL NOT NULL,
    "pseudo" VARCHAR(20) NOT NULL,
    "compte_id" INTEGER,
    "reserve_jusqu_le" TIMESTAMPTZ(3) NOT NULL,
    "raison" VARCHAR(12) NOT NULL,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pseudos_reserves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pseudos_reserves_pseudo_key" ON "pseudos_reserves"("pseudo");

-- CreateIndex
CREATE INDEX "pseudos_reserves_reserve_jusqu_le_idx" ON "pseudos_reserves"("reserve_jusqu_le");

-- CreateIndex
CREATE INDEX "pseudos_reserves_compte_id_idx" ON "pseudos_reserves"("compte_id");

-- AddForeignKey
ALTER TABLE "pseudos_reserves" ADD CONSTRAINT "pseudos_reserves_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
