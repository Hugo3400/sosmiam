-- AlterTable
ALTER TABLE "signalements" ADD COLUMN     "auteur_contenu_id" INTEGER,
ADD COLUMN     "fichier_media" VARCHAR(80),
ADD COLUMN     "instantane_chiffre" VARCHAR(6000),
ADD COLUMN     "signale_par_id" INTEGER;

-- AlterTable
ALTER TABLE "appareils_push" ADD COLUMN     "session_id" INTEGER;

-- CreateTable
CREATE TABLE "notifications_cloche" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "type" VARCHAR(24) NOT NULL,
    "acteur_id" INTEGER,
    "cible" VARCHAR(12),
    "cible_id" VARCHAR(40),
    "detail" VARCHAR(120),
    "en_retour" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_cloche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_sociaux" (
    "compte_id" INTEGER NOT NULL,
    "id_public" VARCHAR(12) NOT NULL,
    "code_invitation_chiffre" VARCHAR(120),
    "code_invitation_le" TIMESTAMPTZ(0),
    "arrivees_par_lien" INTEGER NOT NULL DEFAULT 0,
    "arrivees_depuis" TIMESTAMPTZ(0),
    "trouvable" BOOLEAN NOT NULL DEFAULT true,
    "suggerable" BOOLEAN NOT NULL DEFAULT true,
    "activite_partagee" BOOLEAN NOT NULL DEFAULT true,
    "push_social" BOOLEAN NOT NULL DEFAULT true,
    "cloche_vue_le" TIMESTAMPTZ(3),
    "lieux_recus_vus_jusqua" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profils_sociaux_pkey" PRIMARY KEY ("compte_id")
);

-- CreateTable
CREATE TABLE "membres_bandes" (
    "compte_id" INTEGER NOT NULL,
    "pote_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_bandes_pkey" PRIMARY KEY ("compte_id","pote_id")
);

-- CreateTable
CREATE TABLE "demandes_bandes" (
    "de_id" INTEGER NOT NULL,
    "a_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refusee_le" TIMESTAMPTZ(0),

    CONSTRAINT "demandes_bandes_pkey" PRIMARY KEY ("de_id","a_id")
);

-- CreateTable
CREATE TABLE "blocages" (
    "bloqueur_id" INTEGER NOT NULL,
    "bloque_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocages_pkey" PRIMARY KEY ("bloqueur_id","bloque_id")
);

-- CreateTable
CREATE TABLE "suivis_personnes" (
    "suiveur_id" INTEGER NOT NULL,
    "suivi_id" INTEGER NOT NULL,
    "statut" VARCHAR(8) NOT NULL DEFAULT 'accepte',
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepte_le" TIMESTAMPTZ(0),

    CONSTRAINT "suivis_personnes_pkey" PRIMARY KEY ("suiveur_id","suivi_id")
);

-- CreateTable
CREATE TABLE "elements_masques" (
    "compte_id" INTEGER NOT NULL,
    "cible" VARCHAR(12) NOT NULL,
    "cible_id" VARCHAR(60) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elements_masques_pkey" PRIMARY KEY ("compte_id","cible","cible_id")
);

-- CreateTable
CREATE TABLE "cles_idempotence" (
    "compte_id" INTEGER NOT NULL,
    "cle" VARCHAR(36) NOT NULL,
    "ressource" VARCHAR(8) NOT NULL,
    "ressource_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cles_idempotence_pkey" PRIMARY KEY ("compte_id","cle")
);

-- CreateIndex
CREATE INDEX "notifications_cloche_compte_id_id_idx" ON "notifications_cloche"("compte_id", "id");

-- CreateIndex
CREATE INDEX "notifications_cloche_acteur_id_idx" ON "notifications_cloche"("acteur_id");

-- CreateIndex
CREATE INDEX "notifications_cloche_cree_le_idx" ON "notifications_cloche"("cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "profils_sociaux_id_public_key" ON "profils_sociaux"("id_public");

-- CreateIndex
CREATE INDEX "membres_bandes_pote_id_idx" ON "membres_bandes"("pote_id");

-- CreateIndex
CREATE INDEX "demandes_bandes_a_id_cree_le_idx" ON "demandes_bandes"("a_id", "cree_le");

-- CreateIndex
CREATE INDEX "demandes_bandes_cree_le_idx" ON "demandes_bandes"("cree_le");

-- CreateIndex
CREATE INDEX "blocages_bloque_id_idx" ON "blocages"("bloque_id");

-- CreateIndex
CREATE INDEX "suivis_personnes_suivi_id_statut_cree_le_idx" ON "suivis_personnes"("suivi_id", "statut", "cree_le");

-- CreateIndex
CREATE INDEX "suivis_personnes_suiveur_id_statut_cree_le_idx" ON "suivis_personnes"("suiveur_id", "statut", "cree_le");

-- CreateIndex
CREATE INDEX "elements_masques_cree_le_idx" ON "elements_masques"("cree_le");

-- CreateIndex
CREATE INDEX "cles_idempotence_cree_le_idx" ON "cles_idempotence"("cree_le");

-- CreateIndex
CREATE INDEX "signalements_signale_par_id_cible_idx" ON "signalements"("signale_par_id", "cible");

-- CreateIndex
CREATE INDEX "signalements_cible_cible_id_idx" ON "signalements"("cible", "cible_id");

-- CreateIndex
CREATE INDEX "signalements_auteur_contenu_id_idx" ON "signalements"("auteur_contenu_id");

-- CreateIndex
CREATE INDEX "signalements_fichier_media_idx" ON "signalements"("fichier_media");

-- CreateIndex
CREATE INDEX "appareils_push_compte_id_session_id_idx" ON "appareils_push"("compte_id", "session_id");

-- CreateIndex
CREATE INDEX "appareils_push_session_id_idx" ON "appareils_push"("session_id");

-- AddForeignKey
ALTER TABLE "notifications_cloche" ADD CONSTRAINT "notifications_cloche_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications_cloche" ADD CONSTRAINT "notifications_cloche_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_signale_par_id_fkey" FOREIGN KEY ("signale_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_auteur_contenu_id_fkey" FOREIGN KEY ("auteur_contenu_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appareils_push" ADD CONSTRAINT "appareils_push_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions_comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_sociaux" ADD CONSTRAINT "profils_sociaux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_bandes" ADD CONSTRAINT "membres_bandes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_bandes" ADD CONSTRAINT "membres_bandes_pote_id_fkey" FOREIGN KEY ("pote_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_bandes" ADD CONSTRAINT "demandes_bandes_de_id_fkey" FOREIGN KEY ("de_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demandes_bandes" ADD CONSTRAINT "demandes_bandes_a_id_fkey" FOREIGN KEY ("a_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_bloqueur_id_fkey" FOREIGN KEY ("bloqueur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_bloque_id_fkey" FOREIGN KEY ("bloque_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivis_personnes" ADD CONSTRAINT "suivis_personnes_suiveur_id_fkey" FOREIGN KEY ("suiveur_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suivis_personnes" ADD CONSTRAINT "suivis_personnes_suivi_id_fkey" FOREIGN KEY ("suivi_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elements_masques" ADD CONSTRAINT "elements_masques_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cles_idempotence" ADD CONSTRAINT "cles_idempotence_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
