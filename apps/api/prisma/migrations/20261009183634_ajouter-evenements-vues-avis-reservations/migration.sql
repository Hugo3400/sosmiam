-- CreateTable
CREATE TABLE "avis" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "visite_id" INTEGER,
    "note" SMALLINT NOT NULL,
    "texte" VARCHAR(1000) NOT NULL,
    "photo" VARCHAR(120),
    "signature" VARCHAR(60) NOT NULL,
    "mineur" BOOLEAN NOT NULL DEFAULT false,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'publie',
    "raison_relecture" VARCHAR(20),
    "repas_offert" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reponse_texte" VARCHAR(600),
    "reponse_le" TIMESTAMPTZ(0),
    "reponse_par_id" INTEGER,
    "reponse_statut" VARCHAR(12),

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relectures_avis" (
    "id" SERIAL NOT NULL,
    "avis_id" INTEGER NOT NULL,
    "ambassadeur_id" INTEGER,
    "verdict" VARCHAR(8) NOT NULL,
    "motif" VARCHAR(12),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relectures_avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements_lieux" (
    "id" SERIAL NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "compte_id" INTEGER,
    "titre" VARCHAR(60) NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "debut" TIMESTAMPTZ(0) NOT NULL,
    "fin" TIMESTAMPTZ(0),
    "hebdo_jusqua" TIMESTAMPTZ(0),
    "tarif" VARCHAR(12) NOT NULL,
    "prix_centimes" INTEGER,
    "places" SMALLINT,
    "photo" VARCHAR(120),
    "alcool" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifie_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annule_le" TIMESTAMPTZ(0),
    "suspendu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "evenements_lieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interets_evenements" (
    "compte_id" INTEGER NOT NULL,
    "evenement_id" INTEGER NOT NULL,
    "rappel" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interets_evenements_pkey" PRIMARY KEY ("compte_id","evenement_id")
);

-- CreateTable
CREATE TABLE "vues_lieux" (
    "lieu_id" INTEGER NOT NULL,
    "jour" DATE NOT NULL,
    "nombre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vues_lieux_pkey" PRIMARY KEY ("lieu_id","jour")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lieu_id" INTEGER NOT NULL,
    "personnes" SMALLINT NOT NULL,
    "creneau" TIMESTAMPTZ(0) NOT NULL,
    "message" VARCHAR(140),
    "statut" VARCHAR(10) NOT NULL DEFAULT 'demandee',
    "motif_refus" VARCHAR(18),
    "tardive" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repondu_le" TIMESTAMPTZ(0),
    "repondu_par_id" INTEGER,
    "presence_le" TIMESTAMPTZ(0),
    "code" VARCHAR(4),

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avis_visite_id_key" ON "avis"("visite_id");

-- CreateIndex
CREATE INDEX "avis_lieu_id_statut_cree_le_idx" ON "avis"("lieu_id", "statut", "cree_le");

-- CreateIndex
CREATE INDEX "avis_compte_id_cree_le_idx" ON "avis"("compte_id", "cree_le");

-- CreateIndex
CREATE INDEX "avis_statut_cree_le_idx" ON "avis"("statut", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "relectures_avis_avis_id_ambassadeur_id_key" ON "relectures_avis"("avis_id", "ambassadeur_id");

-- CreateIndex
CREATE INDEX "evenements_lieux_lieu_id_debut_idx" ON "evenements_lieux"("lieu_id", "debut");

-- CreateIndex
CREATE INDEX "evenements_lieux_debut_idx" ON "evenements_lieux"("debut");

-- CreateIndex
CREATE INDEX "interets_evenements_evenement_id_idx" ON "interets_evenements"("evenement_id");

-- CreateIndex
CREATE INDEX "reservations_compte_id_creneau_idx" ON "reservations"("compte_id", "creneau");

-- CreateIndex
CREATE INDEX "reservations_lieu_id_statut_creneau_idx" ON "reservations"("lieu_id", "statut", "creneau");

-- CreateIndex
CREATE INDEX "reservations_statut_creneau_idx" ON "reservations"("statut", "creneau");

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_visite_id_fkey" FOREIGN KEY ("visite_id") REFERENCES "visites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_reponse_par_id_fkey" FOREIGN KEY ("reponse_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relectures_avis" ADD CONSTRAINT "relectures_avis_avis_id_fkey" FOREIGN KEY ("avis_id") REFERENCES "avis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relectures_avis" ADD CONSTRAINT "relectures_avis_ambassadeur_id_fkey" FOREIGN KEY ("ambassadeur_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_lieux" ADD CONSTRAINT "evenements_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_lieux" ADD CONSTRAINT "evenements_lieux_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interets_evenements" ADD CONSTRAINT "interets_evenements_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interets_evenements" ADD CONSTRAINT "interets_evenements_evenement_id_fkey" FOREIGN KEY ("evenement_id") REFERENCES "evenements_lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vues_lieux" ADD CONSTRAINT "vues_lieux_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_repondu_par_id_fkey" FOREIGN KEY ("repondu_par_id") REFERENCES "comptes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
