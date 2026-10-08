-- CreateTable
CREATE TABLE "sessions_gestion" (
    "id" SERIAL NOT NULL,
    "empreinte" VARCHAR(64) NOT NULL,
    "poste_id" VARCHAR(20) NOT NULL,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activite" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_gestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_gestion_empreinte_key" ON "sessions_gestion"("empreinte");
