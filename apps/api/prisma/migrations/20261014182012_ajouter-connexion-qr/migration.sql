-- CreateTable
CREATE TABLE "demandes_connexion_qr" (
    "id" SERIAL NOT NULL,
    "code_empreinte" VARCHAR(64) NOT NULL,
    "secret_empreinte" VARCHAR(64) NOT NULL,
    "cible" VARCHAR(4) NOT NULL,
    "origine" VARCHAR(30) NOT NULL,
    "appareil" VARCHAR(60) NOT NULL,
    "statut" VARCHAR(10) NOT NULL DEFAULT 'attente',
    "compte_id" INTEGER,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_le" TIMESTAMPTZ(3) NOT NULL,
    "scanne_le" TIMESTAMPTZ(3),
    "repondu_le" TIMESTAMPTZ(3),

    CONSTRAINT "demandes_connexion_qr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demandes_connexion_qr_code_empreinte_key" ON "demandes_connexion_qr"("code_empreinte");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_connexion_qr_secret_empreinte_key" ON "demandes_connexion_qr"("secret_empreinte");

-- CreateIndex
CREATE INDEX "demandes_connexion_qr_expire_le_idx" ON "demandes_connexion_qr"("expire_le");

-- CreateIndex
CREATE INDEX "demandes_connexion_qr_compte_id_idx" ON "demandes_connexion_qr"("compte_id");

-- AddForeignKey
ALTER TABLE "demandes_connexion_qr" ADD CONSTRAINT "demandes_connexion_qr_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
