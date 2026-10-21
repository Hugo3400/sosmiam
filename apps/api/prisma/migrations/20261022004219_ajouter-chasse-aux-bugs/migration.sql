-- CreateTable
CREATE TABLE "signalements_securite" (
    "id" UUID NOT NULL,
    "nom_chiffre" VARCHAR(400) NOT NULL,
    "email_chiffre" VARCHAR(1200) NOT NULL,
    "email_empreinte" VARCHAR(64) NOT NULL,
    "cible" VARCHAR(12) NOT NULL,
    "titre_chiffre" VARCHAR(700) NOT NULL,
    "description_chiffree" TEXT NOT NULL,
    "lien_chiffre" VARCHAR(1300),
    "images" VARCHAR(64)[] DEFAULT ARRAY[]::VARCHAR(64)[],
    "nom_tableau_chiffre" VARCHAR(300),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'nouveau',
    "gravite" VARCHAR(10),
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cloture_le" TIMESTAMPTZ(0),
    "badge_donne_le" TIMESTAMPTZ(0),

    CONSTRAINT "signalements_securite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tableau_honneur_securite" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(40) NOT NULL,
    "mois" VARCHAR(7) NOT NULL,
    "signalement_id" UUID,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tableau_honneur_securite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signalements_securite_cree_le_idx" ON "signalements_securite"("cree_le");

-- CreateIndex
CREATE INDEX "signalements_securite_statut_cree_le_idx" ON "signalements_securite"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "signalements_securite_cloture_le_idx" ON "signalements_securite"("cloture_le");

-- CreateIndex
CREATE INDEX "signalements_securite_email_empreinte_cree_le_idx" ON "signalements_securite"("email_empreinte", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "tableau_honneur_securite_signalement_id_key" ON "tableau_honneur_securite"("signalement_id");

-- CreateIndex
CREATE INDEX "tableau_honneur_securite_mois_id_idx" ON "tableau_honneur_securite"("mois", "id");

-- AddForeignKey
ALTER TABLE "tableau_honneur_securite" ADD CONSTRAINT "tableau_honneur_securite_signalement_id_fkey" FOREIGN KEY ("signalement_id") REFERENCES "signalements_securite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
