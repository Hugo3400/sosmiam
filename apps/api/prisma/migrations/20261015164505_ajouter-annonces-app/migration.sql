-- CreateTable
CREATE TABLE "annonces_app" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(60) NOT NULL,
    "texte" VARCHAR(300) NOT NULL,
    "emoji" VARCHAR(16),
    "bouton_libelle" VARCHAR(30),
    "bouton_lien" VARCHAR(200),
    "cible" VARCHAR(12) NOT NULL DEFAULT 'tous',
    "ville" VARCHAR(80),
    "debut" TIMESTAMPTZ(0) NOT NULL,
    "fin" TIMESTAMPTZ(0),
    "publiee_le" TIMESTAMPTZ(0),
    "retiree_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_app_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annonces_app_publiee_le_debut_idx" ON "annonces_app"("publiee_le", "debut");
