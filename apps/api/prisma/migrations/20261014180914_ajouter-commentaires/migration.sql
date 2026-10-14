-- CreateTable
CREATE TABLE "commentaires_publications" (
    "id" SERIAL NOT NULL,
    "publication_id" INTEGER NOT NULL,
    "auteur_id" INTEGER,
    "comme_lieu_id" INTEGER,
    "ecrit_par_id" INTEGER,
    "texte" VARCHAR(500) NOT NULL,
    "mentions" JSONB NOT NULL DEFAULT '[]',
    "reponse_a_id" INTEGER,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0),
    "supprime_le" TIMESTAMPTZ(0),
    "masque_par_lieu_le" TIMESTAMPTZ(0),
    "suspendu_le" TIMESTAMPTZ(0),
    "retire_le" TIMESTAMPTZ(0),

    CONSTRAINT "commentaires_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jaimes_commentaires" (
    "commentaire_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jaimes_commentaires_pkey" PRIMARY KEY ("commentaire_id","compte_id")
);

-- CreateIndex
CREATE INDEX "commentaires_publications_publication_id_id_idx" ON "commentaires_publications"("publication_id", "id");

-- CreateIndex
CREATE INDEX "commentaires_publications_auteur_id_idx" ON "commentaires_publications"("auteur_id");

-- CreateIndex
CREATE INDEX "commentaires_publications_comme_lieu_id_idx" ON "commentaires_publications"("comme_lieu_id");

-- CreateIndex
CREATE INDEX "commentaires_publications_ecrit_par_id_idx" ON "commentaires_publications"("ecrit_par_id");

-- CreateIndex
CREATE INDEX "commentaires_publications_reponse_a_id_idx" ON "commentaires_publications"("reponse_a_id");

-- CreateIndex
CREATE INDEX "jaimes_commentaires_compte_id_idx" ON "jaimes_commentaires"("compte_id");

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_comme_lieu_id_fkey" FOREIGN KEY ("comme_lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_ecrit_par_id_fkey" FOREIGN KEY ("ecrit_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_publications" ADD CONSTRAINT "commentaires_publications_reponse_a_id_fkey" FOREIGN KEY ("reponse_a_id") REFERENCES "commentaires_publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_commentaires" ADD CONSTRAINT "jaimes_commentaires_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaires_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_commentaires" ADD CONSTRAINT "jaimes_commentaires_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
