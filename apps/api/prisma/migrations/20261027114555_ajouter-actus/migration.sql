-- CreateTable
CREATE TABLE "articles_actus" (
    "id" SERIAL NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "rubrique" VARCHAR(16) NOT NULL,
    "titre" VARCHAR(70) NOT NULL,
    "accroche" VARCHAR(140) NOT NULL,
    "texte" VARCHAR(3000) NOT NULL,
    "citation" VARCHAR(200),
    "couverture" VARCHAR(64) NOT NULL,
    "photos" VARCHAR(64)[],
    "collaboration" BOOLEAN NOT NULL,
    "alcool" BOOLEAN NOT NULL DEFAULT false,
    "fin_le" DATE,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-relecture',
    "a_la_une" BOOLEAN NOT NULL DEFAULT false,
    "renvoye" BOOLEAN NOT NULL DEFAULT false,
    "retouche_message" VARCHAR(1000),
    "retouche_le" TIMESTAMPTZ(0),
    "refus_motif" VARCHAR(16),
    "refus_motivation" VARCHAR(1000),
    "refus_le" TIMESTAMPTZ(0),
    "envoye_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publie_le" TIMESTAMPTZ(0),

    CONSTRAINT "articles_actus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lieux_articles_actus" (
    "article_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "rang" SMALLINT NOT NULL,

    CONSTRAINT "lieux_articles_actus_pkey" PRIMARY KEY ("article_id","lieu_id")
);

-- CreateTable
CREATE TABLE "jaimes_articles_actus" (
    "compte_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jaimes_articles_actus_pkey" PRIMARY KEY ("compte_id","article_id")
);

-- CreateTable
CREATE TABLE "reponses_lieux_actus" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "ecrit_par_id" INTEGER,
    "texte" VARCHAR(500) NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-relecture',
    "reecrite" BOOLEAN NOT NULL DEFAULT false,
    "refus_motif" VARCHAR(16),
    "envoye_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMPTZ(0),

    CONSTRAINT "reponses_lieux_actus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_actus_statut_publie_le_idx" ON "articles_actus"("statut", "publie_le");

-- CreateIndex
CREATE INDEX "articles_actus_auteur_id_envoye_le_idx" ON "articles_actus"("auteur_id", "envoye_le");

-- CreateIndex
CREATE INDEX "lieux_articles_actus_lieu_id_idx" ON "lieux_articles_actus"("lieu_id");

-- CreateIndex
CREATE INDEX "jaimes_articles_actus_article_id_idx" ON "jaimes_articles_actus"("article_id");

-- CreateIndex
CREATE INDEX "reponses_lieux_actus_statut_envoye_le_idx" ON "reponses_lieux_actus"("statut", "envoye_le");

-- CreateIndex
CREATE UNIQUE INDEX "reponses_lieux_actus_article_id_lieu_id_key" ON "reponses_lieux_actus"("article_id", "lieu_id");

-- AddForeignKey
ALTER TABLE "articles_actus" ADD CONSTRAINT "articles_actus_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_articles_actus" ADD CONSTRAINT "lieux_articles_actus_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_actus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_articles_actus" ADD CONSTRAINT "lieux_articles_actus_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_articles_actus" ADD CONSTRAINT "jaimes_articles_actus_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_articles_actus" ADD CONSTRAINT "jaimes_articles_actus_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_actus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_lieux_actus" ADD CONSTRAINT "reponses_lieux_actus_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_actus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_lieux_actus" ADD CONSTRAINT "reponses_lieux_actus_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reponses_lieux_actus" ADD CONSTRAINT "reponses_lieux_actus_ecrit_par_id_fkey" FOREIGN KEY ("ecrit_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
