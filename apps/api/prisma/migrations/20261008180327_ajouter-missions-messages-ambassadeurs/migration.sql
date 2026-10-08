-- CreateTable
CREATE TABLE "missions_ambassadeurs" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "titre" VARCHAR(100) NOT NULL,
    "detail" VARCHAR(2000) NOT NULL DEFAULT '',
    "lieu_id" INTEGER,
    "echeance" TIMESTAMPTZ(0),
    "statut" VARCHAR(10) NOT NULL DEFAULT 'a-faire',
    "compte_rendu" VARCHAR(2000),
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "faite_le" TIMESTAMPTZ(0),

    CONSTRAINT "missions_ambassadeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages_ambassadeurs" (
    "id" SERIAL NOT NULL,
    "compte_id" INTEGER,
    "titre" VARCHAR(100) NOT NULL,
    "texte" VARCHAR(3000) NOT NULL,
    "cree_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_ambassadeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectures_messages" (
    "message_id" INTEGER NOT NULL,
    "compte_id" INTEGER NOT NULL,
    "lu_le" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectures_messages_pkey" PRIMARY KEY ("message_id","compte_id")
);

-- CreateIndex
CREATE INDEX "missions_ambassadeurs_compte_id_statut_idx" ON "missions_ambassadeurs"("compte_id", "statut");

-- CreateIndex
CREATE INDEX "missions_ambassadeurs_statut_echeance_idx" ON "missions_ambassadeurs"("statut", "echeance");

-- CreateIndex
CREATE INDEX "messages_ambassadeurs_compte_id_cree_le_idx" ON "messages_ambassadeurs"("compte_id", "cree_le");

-- CreateIndex
CREATE INDEX "lectures_messages_compte_id_idx" ON "lectures_messages"("compte_id");

-- AddForeignKey
ALTER TABLE "missions_ambassadeurs" ADD CONSTRAINT "missions_ambassadeurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions_ambassadeurs" ADD CONSTRAINT "missions_ambassadeurs_lieu_id_fkey" FOREIGN KEY ("lieu_id") REFERENCES "lieux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_ambassadeurs" ADD CONSTRAINT "messages_ambassadeurs_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures_messages" ADD CONSTRAINT "lectures_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages_ambassadeurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures_messages" ADD CONSTRAINT "lectures_messages_compte_id_fkey" FOREIGN KEY ("compte_id") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
