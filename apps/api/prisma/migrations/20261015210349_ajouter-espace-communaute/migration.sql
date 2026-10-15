-- CreateTable
CREATE TABLE "profils_communaute" (
    "compte_id" INTEGER NOT NULL,
    "genre_chiffre" VARCHAR(120),
    "genre_choisi_le" TIMESTAMPTZ(0),
    "qui_est_la" BOOLEAN NOT NULL DEFAULT false,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profils_communaute_pkey" PRIMARY KEY ("compte_id")
);

-- CreateTable
CREATE TABLE "presences_qui_est_la" (
    "compte_id" INTEGER NOT NULL,
    "ville_cle" VARCHAR(80) NOT NULL,
    "jusqua" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "presences_qui_est_la_pkey" PRIMARY KEY ("compte_id")
);

-- CreateTable
CREATE TABLE "coucous_miamis" (
    "de_id" INTEGER NOT NULL,
    "a_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coucous_miamis_pkey" PRIMARY KEY ("de_id","a_id")
);

-- CreateTable
CREATE TABLE "sorties_des_miamis" (
    "id" SERIAL NOT NULL,
    "organisateur_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "conversation_id" INTEGER,
    "titre" VARCHAR(40) NOT NULL,
    "description" VARCHAR(300) NOT NULL DEFAULT '',
    "quand" TIMESTAMPTZ(0) NOT NULL,
    "ville_cle" VARCHAR(80) NOT NULL,
    "public_type" VARCHAR(12) NOT NULL DEFAULT 'tous',
    "public_valeur" VARCHAR(8),
    "places" SMALLINT NOT NULL,
    "place_gardee_nouveau" BOOLEAN NOT NULL DEFAULT false,
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "serie_id" INTEGER,
    "suite_traitee_le" TIMESTAMPTZ(0),
    "rappel_envoye_le" TIMESTAMPTZ(0),
    "annulee_le" TIMESTAMPTZ(0),
    "annulation_tardive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sorties_des_miamis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations_sorties_des_miamis" (
    "sortie_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "statut" VARCHAR(8) NOT NULL,
    "habitue" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMPTZ(3),
    "present_le" TIMESTAMPTZ(0),

    CONSTRAINT "participations_sorties_des_miamis_pkey" PRIMARY KEY ("sortie_id","compte_id")
);

-- CreateTable
CREATE TABLE "etiquettes_sorties_des_miamis" (
    "sortie_id" INTEGER NOT NULL,
    "nom" VARCHAR(32) NOT NULL,
    "officielle" BOOLEAN NOT NULL DEFAULT false,
    "retiree_le" TIMESTAMPTZ(0),

    CONSTRAINT "etiquettes_sorties_des_miamis_pkey" PRIMARY KEY ("sortie_id","nom")
);

-- CreateTable
CREATE TABLE "idees_communaute" (
    "id" SERIAL NOT NULL,
    "auteur_id" INTEGER,
    "titre" VARCHAR(90) NOT NULL,
    "titre_cle" VARCHAR(120) NOT NULL,
    "detail" VARCHAR(500) NOT NULL DEFAULT '',
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-relecture',
    "reponse_brigade" VARCHAR(1000),
    "repondu_le" TIMESTAMPTZ(0),
    "idee_du_mois" VARCHAR(7),
    "publiee_le" TIMESTAMPTZ(0),
    "modifie_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idees_communaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes_idees_communaute" (
    "idee_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_idees_communaute_pkey" PRIMARY KEY ("idee_id","compte_id")
);

-- CreateTable
CREATE TABLE "commentaires_idees_communaute" (
    "id" SERIAL NOT NULL,
    "idee_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "texte" VARCHAR(500) NOT NULL,
    "reponse_a_id" INTEGER,
    "masque_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commentaires_idees_communaute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jaimes_commentaires_idees" (
    "commentaire_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jaimes_commentaires_idees_pkey" PRIMARY KEY ("commentaire_id","compte_id")
);

-- CreateIndex
CREATE INDEX "presences_qui_est_la_ville_cle_jusqua_idx" ON "presences_qui_est_la"("ville_cle", "jusqua");

-- CreateIndex
CREATE INDEX "presences_qui_est_la_jusqua_idx" ON "presences_qui_est_la"("jusqua");

-- CreateIndex
CREATE INDEX "coucous_miamis_a_id_idx" ON "coucous_miamis"("a_id");

-- CreateIndex
CREATE INDEX "coucous_miamis_cree_le_idx" ON "coucous_miamis"("cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "sorties_des_miamis_conversation_id_key" ON "sorties_des_miamis"("conversation_id");

-- CreateIndex
CREATE INDEX "sorties_des_miamis_ville_cle_quand_idx" ON "sorties_des_miamis"("ville_cle", "quand");

-- CreateIndex
CREATE INDEX "sorties_des_miamis_organisateur_id_quand_idx" ON "sorties_des_miamis"("organisateur_id", "quand");

-- CreateIndex
CREATE INDEX "sorties_des_miamis_lieu_id_idx" ON "sorties_des_miamis"("lieu_id");

-- CreateIndex
CREATE INDEX "sorties_des_miamis_quand_idx" ON "sorties_des_miamis"("quand");

-- CreateIndex
CREATE INDEX "sorties_des_miamis_serie_id_idx" ON "sorties_des_miamis"("serie_id");

-- CreateIndex
CREATE INDEX "participations_sorties_des_miamis_compte_id_statut_idx" ON "participations_sorties_des_miamis"("compte_id", "statut");

-- CreateIndex
CREATE INDEX "etiquettes_sorties_des_miamis_nom_idx" ON "etiquettes_sorties_des_miamis"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "idees_communaute_idee_du_mois_key" ON "idees_communaute"("idee_du_mois");

-- CreateIndex
CREATE INDEX "idees_communaute_statut_cree_le_idx" ON "idees_communaute"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "idees_communaute_auteur_id_idx" ON "idees_communaute"("auteur_id");

-- CreateIndex
CREATE INDEX "idees_communaute_titre_cle_idx" ON "idees_communaute"("titre_cle");

-- CreateIndex
CREATE INDEX "votes_idees_communaute_compte_id_idx" ON "votes_idees_communaute"("compte_id");

-- CreateIndex
CREATE INDEX "votes_idees_communaute_cree_le_idx" ON "votes_idees_communaute"("cree_le");

-- CreateIndex
CREATE INDEX "commentaires_idees_communaute_idee_id_cree_le_idx" ON "commentaires_idees_communaute"("idee_id", "cree_le");

-- CreateIndex
CREATE INDEX "commentaires_idees_communaute_auteur_id_idx" ON "commentaires_idees_communaute"("auteur_id");

-- CreateIndex
CREATE INDEX "commentaires_idees_communaute_reponse_a_id_idx" ON "commentaires_idees_communaute"("reponse_a_id");

-- CreateIndex
CREATE INDEX "jaimes_commentaires_idees_compte_id_idx" ON "jaimes_commentaires_idees"("compte_id");

-- AddForeignKey
ALTER TABLE "profils_communaute" ADD CONSTRAINT "profils_communaute_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences_qui_est_la" ADD CONSTRAINT "presences_qui_est_la_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coucous_miamis" ADD CONSTRAINT "coucous_miamis_de_id_fkey" FOREIGN KEY ("de_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coucous_miamis" ADD CONSTRAINT "coucous_miamis_a_id_fkey" FOREIGN KEY ("a_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_des_miamis" ADD CONSTRAINT "sorties_des_miamis_organisateur_id_fkey" FOREIGN KEY ("organisateur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_des_miamis" ADD CONSTRAINT "sorties_des_miamis_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorties_des_miamis" ADD CONSTRAINT "sorties_des_miamis_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations_sorties_des_miamis" ADD CONSTRAINT "participations_sorties_des_miamis_sortie_id_fkey" FOREIGN KEY ("sortie_id") REFERENCES "sorties_des_miamis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations_sorties_des_miamis" ADD CONSTRAINT "participations_sorties_des_miamis_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etiquettes_sorties_des_miamis" ADD CONSTRAINT "etiquettes_sorties_des_miamis_sortie_id_fkey" FOREIGN KEY ("sortie_id") REFERENCES "sorties_des_miamis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idees_communaute" ADD CONSTRAINT "idees_communaute_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_idees_communaute" ADD CONSTRAINT "votes_idees_communaute_idee_id_fkey" FOREIGN KEY ("idee_id") REFERENCES "idees_communaute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes_idees_communaute" ADD CONSTRAINT "votes_idees_communaute_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_idees_communaute" ADD CONSTRAINT "commentaires_idees_communaute_idee_id_fkey" FOREIGN KEY ("idee_id") REFERENCES "idees_communaute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_idees_communaute" ADD CONSTRAINT "commentaires_idees_communaute_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaires_idees_communaute" ADD CONSTRAINT "commentaires_idees_communaute_reponse_a_id_fkey" FOREIGN KEY ("reponse_a_id") REFERENCES "commentaires_idees_communaute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_commentaires_idees" ADD CONSTRAINT "jaimes_commentaires_idees_commentaire_id_fkey" FOREIGN KEY ("commentaire_id") REFERENCES "commentaires_idees_communaute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jaimes_commentaires_idees" ADD CONSTRAINT "jaimes_commentaires_idees_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
