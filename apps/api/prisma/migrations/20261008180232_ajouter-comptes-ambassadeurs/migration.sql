-- AlterTable
ALTER TABLE "demandes_lieux" ADD COLUMN     "compte_id" INTEGER;

-- CreateTable
CREATE TABLE "comptes" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "mot_de_passe" VARCHAR(200) NOT NULL,
    "prenom" VARCHAR(40) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "palier" VARCHAR(20) NOT NULL DEFAULT 'curieux',
    "cgu_version" VARCHAR(10) NOT NULL,
    "jeton_reinitialisation" VARCHAR(64),
    "jeton_expire_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_connexion" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassadeurs" (
    "compte_id" INTEGER NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "ville" VARCHAR(80) NOT NULL,
    "quartier" VARCHAR(80),
    "note_equipe" VARCHAR(2000),
    "decide_le" TIMESTAMPTZ(0),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambassadeurs_pkey" PRIMARY KEY ("compte_id")
);

-- CreateTable
CREATE TABLE "sessions_comptes" (
    "id" SERIAL NOT NULL,
    "empreinte" VARCHAR(64) NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "support" VARCHAR(4) NOT NULL DEFAULT 'site',
    "cree_le" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activite" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges_comptes" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "badge" VARCHAR(30) NOT NULL,
    "obtenu_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_points" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "raison" VARCHAR(40) NOT NULL,
    "detail" VARCHAR(200),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures_fondateurs" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "pepites" VARCHAR(1500) NOT NULL,
    "envies" VARCHAR(80) NOT NULL,
    "reseaux" VARCHAR(200),
    "motivation" VARCHAR(600) NOT NULL,
    "partant_rencontre" BOOLEAN NOT NULL,
    "connu_par" VARCHAR(120),
    "statut" VARCHAR(12) NOT NULL DEFAULT 'en-attente',
    "numero" INTEGER,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),

    CONSTRAINT "candidatures_fondateurs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_email_key" ON "comptes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_jeton_reinitialisation_key" ON "comptes"("jeton_reinitialisation");

-- CreateIndex
CREATE INDEX "comptes_derniere_connexion_idx" ON "comptes"("derniere_connexion");

-- CreateIndex
CREATE INDEX "ambassadeurs_statut_idx" ON "ambassadeurs"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_comptes_empreinte_key" ON "sessions_comptes"("empreinte");

-- CreateIndex
CREATE INDEX "sessions_comptes_compte_id_idx" ON "sessions_comptes"("compte_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_comptes_compte_id_badge_key" ON "badges_comptes"("compte_id", "badge");

-- CreateIndex
CREATE INDEX "journal_points_compte_id_cree_le_idx" ON "journal_points"("compte_id", "cree_le");

-- CreateIndex
CREATE INDEX "candidatures_fondateurs_compte_id_idx" ON "candidatures_fondateurs"("compte_id");

-- CreateIndex
CREATE INDEX "candidatures_fondateurs_statut_cree_le_idx" ON "candidatures_fondateurs"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "demandes_lieux_compte_id_idx" ON "demandes_lieux"("compte_id");

-- AddForeignKey
ALTER TABLE "demandes_lieux" ADD CONSTRAINT "demandes_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadeurs" ADD CONSTRAINT "ambassadeurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_comptes" ADD CONSTRAINT "sessions_comptes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges_comptes" ADD CONSTRAINT "badges_comptes_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_points" ADD CONSTRAINT "journal_points_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures_fondateurs" ADD CONSTRAINT "candidatures_fondateurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
