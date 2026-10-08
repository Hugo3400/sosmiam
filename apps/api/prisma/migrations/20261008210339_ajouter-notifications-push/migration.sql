-- CreateTable
CREATE TABLE "appareils_push" (
    "id" SERIAL NOT NULL,
    "jeton" VARCHAR(400) NOT NULL,
    "plateforme" VARCHAR(8) NOT NULL,
    "compte_id" INTEGER,
    "ville" VARCHAR(80),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vu_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appareils_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications_push" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(60) NOT NULL,
    "texte" VARCHAR(180) NOT NULL,
    "lien" VARCHAR(200),
    "cible" JSONB NOT NULL DEFAULT '{}',
    "description" VARCHAR(300) NOT NULL DEFAULT '',
    "demandee" BOOLEAN NOT NULL DEFAULT false,
    "programmee_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'programmee',
    "total" INTEGER NOT NULL DEFAULT 0,
    "envoyees" INTEGER NOT NULL DEFAULT 0,
    "echecs" INTEGER NOT NULL DEFAULT 0,
    "ignorees" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoyee_le" TIMESTAMPTZ(0),

    CONSTRAINT "notifications_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receptions_push" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "appareil_id" INTEGER NOT NULL,
    "statut" VARCHAR(8) NOT NULL,
    "erreur" VARCHAR(200),
    "compte" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receptions_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appareils_push_jeton_key" ON "appareils_push"("jeton");

-- CreateIndex
CREATE INDEX "appareils_push_actif_plateforme_idx" ON "appareils_push"("actif", "plateforme");

-- CreateIndex
CREATE INDEX "notifications_push_statut_programmee_le_idx" ON "notifications_push"("statut", "programmee_le");

-- CreateIndex
CREATE INDEX "receptions_push_appareil_id_cree_le_idx" ON "receptions_push"("appareil_id", "cree_le");

-- CreateIndex
CREATE UNIQUE INDEX "receptions_push_notification_id_appareil_id_key" ON "receptions_push"("notification_id", "appareil_id");

-- AddForeignKey
ALTER TABLE "appareils_push" ADD CONSTRAINT "appareils_push_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptions_push" ADD CONSTRAINT "receptions_push_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications_push"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptions_push" ADD CONSTRAINT "receptions_push_appareil_id_fkey" FOREIGN KEY ("appareil_id") REFERENCES "appareils_push"("id") ON DELETE CASCADE ON UPDATE CASCADE;
