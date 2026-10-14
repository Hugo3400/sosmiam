-- CreateTable
CREATE TABLE "listes_lieux" (
    "id" SERIAL NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "titre" VARCHAR(40) NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "description" VARCHAR(140) NOT NULL DEFAULT '',
    "visibilite" VARCHAR(6) NOT NULL DEFAULT 'tous',
    "suspendue_le" TIMESTAMPTZ(0),
    "retiree_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listes_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lieux_listes" (
    "liste_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "ajoute_par_id" INTEGER,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lieux_listes_pkey" PRIMARY KEY ("liste_id","lieu_id")
);

-- CreateTable
CREATE TABLE "co_auteurs_listes" (
    "liste_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "statut" VARCHAR(8) NOT NULL DEFAULT 'invite',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),

    CONSTRAINT "co_auteurs_listes_pkey" PRIMARY KEY ("liste_id","compte_id")
);

-- CreateTable
CREATE TABLE "abonnements_listes" (
    "liste_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonnements_listes_pkey" PRIMARY KEY ("liste_id","compte_id")
);

-- CreateTable
CREATE TABLE "sorties" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "organisateur_id" INTEGER,
    "titre" VARCHAR(40) NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "quand" TIMESTAMPTZ(0) NOT NULL,
    "fin_vote" TIMESTAMPTZ(0) NOT NULL,
    "lieu_choisi_id" INTEGER,
    "vote_termine_le" TIMESTAMPTZ(0),
    "version" INTEGER NOT NULL DEFAULT 0,
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sorties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations_sorties" (
    "sortie_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "invite_par_id" INTEGER,
    "statut" VARCHAR(8) NOT NULL DEFAULT 'invite',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),

    CONSTRAINT "invitations_sorties_pkey" PRIMARY KEY ("sortie_id","compte_id")
);

-- CreateTable
CREATE TABLE "propositions_sorties" (
    "id" SERIAL NOT NULL,
    "sortie_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "propose_par_id" INTEGER,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propositions_sorties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes_sorties" (
    "proposition_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_sorties_pkey" PRIMARY KEY ("proposition_id","compte_id")
);

-- CreateIndex
CREATE INDEX "listes_lieux_auteur_id_idx" ON "listes_lieux"("auteur_id");

-- CreateIndex
CREATE INDEX "listes_lieux_modifie_le_idx" ON "listes_lieux"("modifie_le");

-- CreateIndex
CREATE INDEX "lieux_listes_lieu_id_idx" ON "lieux_listes"("lieu_id");

-- CreateIndex
CREATE INDEX "lieux_listes_ajoute_par_id_idx" ON "lieux_listes"("ajoute_par_id");

-- CreateIndex
CREATE INDEX "co_auteurs_listes_compte_id_idx" ON "co_auteurs_listes"("compte_id");

-- CreateIndex
CREATE INDEX "abonnements_listes_compte_id_idx" ON "abonnements_listes"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "sorties_conversation_id_key" ON "sorties"("conversation_id");

-- CreateIndex
CREATE INDEX "sorties_organisateur_id_idx" ON "sorties"("organisateur_id");

-- CreateIndex
CREATE INDEX "sorties_lieu_choisi_id_idx" ON "sorties"("lieu_choisi_id");

-- CreateIndex
CREATE INDEX "sorties_vote_termine_le_fin_vote_idx" ON "sorties"("vote_termine_le", "fin_vote");

-- CreateIndex
CREATE INDEX "sorties_quand_idx" ON "sorties"("quand");

-- CreateIndex
CREATE INDEX "invitations_sorties_compte_id_statut_idx" ON "invitations_sorties"("compte_id", "statut");

-- CreateIndex
CREATE INDEX "invitations_sorties_invite_par_id_idx" ON "invitations_sorties"("invite_par_id");

-- CreateIndex
CREATE INDEX "propositions_sorties_lieu_id_idx" ON "propositions_sorties"("lieu_id");

-- CreateIndex
CREATE INDEX "propositions_sorties_propose_par_id_idx" ON "propositions_sorties"("propose_par_id");

-- CreateIndex
CREATE UNIQUE INDEX "propositions_sorties_sortie_id_lieu_id_key" ON "propositions_sorties"("sortie_id", "lieu_id");

-- CreateIndex
CREATE INDEX "votes_sorties_compte_id_idx" ON "votes_sorties"("compte_id");

-- AddForeignKey
ALTER TABLE "listes_lieux" ADD CONSTRAINT "listes_lieux_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_listes" ADD CONSTRAINT "lieux_listes_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "listes_lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_listes" ADD CONSTRAINT "lieux_listes_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lieux_listes" ADD CONSTRAINT "lieux_listes_ajoute_par_id_fkey" FOREIGN KEY ("ajoute_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_auteurs_listes" ADD CONSTRAINT "co_auteurs_listes_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "listes_lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_auteurs_listes" ADD CONSTRAINT "co_auteurs_listes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_listes" ADD CONSTRAINT "abonnements_listes_liste_id_fkey" FOREIGN KEY ("liste_id") REFERENCES "listes_lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements_listes" ADD CONSTRAINT "abonnements_listes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties" ADD CONSTRAINT "sorties_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties" ADD CONSTRAINT "sorties_organisateur_id_fkey" FOREIGN KEY ("organisateur_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties" ADD CONSTRAINT "sorties_lieu_choisi_id_fkey" FOREIGN KEY ("lieu_choisi_id") REFERENCES "lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_sorties" ADD CONSTRAINT "invitations_sorties_sortie_id_fkey" FOREIGN KEY ("sortie_id") REFERENCES "sorties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_sorties" ADD CONSTRAINT "invitations_sorties_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations_sorties" ADD CONSTRAINT "invitations_sorties_invite_par_id_fkey" FOREIGN KEY ("invite_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propositions_sorties" ADD CONSTRAINT "propositions_sorties_sortie_id_fkey" FOREIGN KEY ("sortie_id") REFERENCES "sorties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propositions_sorties" ADD CONSTRAINT "propositions_sorties_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propositions_sorties" ADD CONSTRAINT "propositions_sorties_propose_par_id_fkey" FOREIGN KEY ("propose_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_sorties" ADD CONSTRAINT "votes_sorties_proposition_id_fkey" FOREIGN KEY ("proposition_id") REFERENCES "propositions_sorties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_sorties" ADD CONSTRAINT "votes_sorties_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
