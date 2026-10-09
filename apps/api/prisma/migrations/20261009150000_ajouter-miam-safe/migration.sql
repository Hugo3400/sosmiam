-- CreateTable
CREATE TABLE "chartes_miam_safe" (
    "lieu_id" INTEGER NOT NULL,
    "signee_par_id" INTEGER,
    "signee_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiree_le" TIMESTAMPTZ(0),
    "motif_retrait" VARCHAR(500),

    CONSTRAINT "chartes_miam_safe_pkey" PRIMARY KEY ("lieu_id")
);

-- CreateTable
CREATE TABLE "alertes_miam_safe" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "prenom" VARCHAR(40) NOT NULL,
    "endroit" VARCHAR(12) NOT NULL,
    "detail" VARCHAR(80) NOT NULL DEFAULT '',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondue_le" TIMESTAMPTZ(0),
    "repondu_par_id" INTEGER,
    "vue_le" TIMESTAMPTZ(0),

    CONSTRAINT "alertes_miam_safe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signalements_miam_safe" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER,
    "raison" VARCHAR(16) NOT NULL,
    "explication" VARCHAR(500) NOT NULL DEFAULT '',
    "statut" VARCHAR(10) NOT NULL DEFAULT 'a-traiter',
    "action" VARCHAR(16),
    "note" VARCHAR(1000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_le" TIMESTAMPTZ(0),

    CONSTRAINT "signalements_miam_safe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses_senti_bien" (
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "oui" BOOLEAN NOT NULL,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reponses_senti_bien_pkey" PRIMARY KEY ("lieu_id","compte_id")
);

-- CreateIndex
CREATE INDEX "alertes_miam_safe_lieu_id_cree_le_idx" ON "alertes_miam_safe"("lieu_id", "cree_le");

-- CreateIndex
CREATE INDEX "alertes_miam_safe_compte_id_cree_le_idx" ON "alertes_miam_safe"("compte_id", "cree_le");

-- CreateIndex
CREATE INDEX "alertes_miam_safe_repondue_le_cree_le_idx" ON "alertes_miam_safe"("repondue_le", "cree_le");

-- CreateIndex
CREATE INDEX "signalements_miam_safe_statut_cree_le_idx" ON "signalements_miam_safe"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "signalements_miam_safe_lieu_id_idx" ON "signalements_miam_safe"("lieu_id");

-- AddForeignKey
ALTER TABLE "chartes_miam_safe" ADD CONSTRAINT "chartes_miam_safe_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chartes_miam_safe" ADD CONSTRAINT "chartes_miam_safe_signee_par_id_fkey" FOREIGN KEY ("signee_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes_miam_safe" ADD CONSTRAINT "alertes_miam_safe_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes_miam_safe" ADD CONSTRAINT "alertes_miam_safe_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertes_miam_safe" ADD CONSTRAINT "alertes_miam_safe_repondu_par_id_fkey" FOREIGN KEY ("repondu_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements_miam_safe" ADD CONSTRAINT "signalements_miam_safe_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements_miam_safe" ADD CONSTRAINT "signalements_miam_safe_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_senti_bien" ADD CONSTRAINT "reponses_senti_bien_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_senti_bien" ADD CONSTRAINT "reponses_senti_bien_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
