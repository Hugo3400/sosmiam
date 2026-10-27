-- CreateTable
CREATE TABLE "commentaires_articles_actus" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "texte" VARCHAR(500) NOT NULL,
    "reponse_a_id" INTEGER,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supprime_le" TIMESTAMPTZ(0),
    "retire_le" TIMESTAMPTZ(0),

    CONSTRAINT "commentaires_articles_actus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commentaires_articles_actus_article_id_id_idx" ON "commentaires_articles_actus"("article_id", "id");

-- CreateIndex
CREATE INDEX "commentaires_articles_actus_auteur_id_idx" ON "commentaires_articles_actus"("auteur_id");

-- CreateIndex
CREATE INDEX "commentaires_articles_actus_reponse_a_id_idx" ON "commentaires_articles_actus"("reponse_a_id");

-- AddForeignKey
ALTER TABLE "commentaires_articles_actus" ADD CONSTRAINT "commentaires_articles_actus_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_actus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_articles_actus" ADD CONSTRAINT "commentaires_articles_actus_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_articles_actus" ADD CONSTRAINT "commentaires_articles_actus_reponse_a_id_fkey" FOREIGN KEY ("reponse_a_id") REFERENCES "commentaires_articles_actus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
